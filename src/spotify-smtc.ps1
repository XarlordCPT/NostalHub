# Ayudante de NostalHub: lee y controla Spotify a través de los controles multimedia de Windows
# (los mismos que aparecen al subir el volumen). Da título, artista, estado y la portada del álbum.
# Protocolo: recibe un comando por línea (poll | toggle | next | prev) y responde una línea JSON.

$ErrorActionPreference = 'Stop'
try { [Console]::OutputEncoding = [System.Text.Encoding]::UTF8 } catch { }

function Send($obj) {
  [Console]::Out.WriteLine(($obj | ConvertTo-Json -Compress -Depth 3))
  [Console]::Out.Flush()
}

try {
  Add-Type -AssemblyName System.Runtime.WindowsRuntime
  $asTaskGeneric = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object {
      $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1'
    })[0]
  function Await($op, [Type]$type) {
    $task = $asTaskGeneric.MakeGenericMethod($type).Invoke($null, @($op))
    $task.Wait(-1) | Out-Null
    $task.Result
  }
  [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager, Windows.Media.Control, ContentType = WindowsRuntime] | Out-Null
  [Windows.Storage.Streams.IRandomAccessStreamWithContentType, Windows.Storage.Streams, ContentType = WindowsRuntime] | Out-Null
  $manager = Await ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager]::RequestAsync()) ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager])
  Send @{ ready = $true }
} catch {
  Send @{ ready = $false; error = $_.Exception.Message }
  exit 1
}

$lastKey = ''
$thumbTries = 0

while ($true) {
  $cmd = [Console]::In.ReadLine()
  if ($cmd -eq $null) { break }
  try {
    $session = $manager.GetSessions() | Where-Object { $_.SourceAppUserModelId -match 'Spotify' } | Select-Object -First 1
    if (-not $session) { Send @{ ok = $true; found = $false }; continue }

    switch ($cmd) {
      'toggle' { Await ($session.TryTogglePlayPauseAsync()) ([bool]) | Out-Null }
      'next'   { Await ($session.TrySkipNextAsync()) ([bool]) | Out-Null }
      'prev'   { Await ($session.TrySkipPreviousAsync()) ([bool]) | Out-Null }
    }

    $props = Await ($session.TryGetMediaPropertiesAsync()) ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionMediaProperties])
    $status = $session.GetPlaybackInfo().PlaybackStatus.ToString()
    $res = @{ ok = $true; found = $true; title = $props.Title; artist = $props.Artist; album = $props.AlbumTitle; status = $status }

    # La portada se manda una vez por canción. Si todavía no está lista (Spotify a veces la
    # carga unos segundos después del título), se vuelve a intentar en las siguientes consultas.
    $key = "$($props.Artist)|$($props.Title)"
    if ($key -ne $lastKey) { $lastKey = $key; $thumbTries = 15 }
    if ($thumbTries -gt 0) {
      $thumbTries--
      if ($props.Thumbnail) {
        try {
          $stream = Await ($props.Thumbnail.OpenReadAsync()) ([Windows.Storage.Streams.IRandomAccessStreamWithContentType])
          $net = [System.IO.WindowsRuntimeStreamExtensions]::AsStreamForRead($stream)
          $ms = New-Object System.IO.MemoryStream
          $net.CopyTo($ms)
          $bytes = $ms.ToArray()
          $net.Dispose()
          if ($bytes.Length -gt 200) {
            $res.thumb = [Convert]::ToBase64String($bytes)
            $res.thumbType = $stream.ContentType
            $thumbTries = 0
          }
        } catch { $res.thumbError = $_.Exception.Message }
      }
    }
    Send $res
  } catch {
    Send @{ ok = $false; error = $_.Exception.Message }
  }
}
