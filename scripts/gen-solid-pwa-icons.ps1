Add-Type -AssemblyName System.Drawing
$brandDir = Join-Path $PSScriptRoot "..\public\brand" | Resolve-Path
foreach ($size in @(192, 512)) {
  $bmp = New-Object Drawing.Bitmap $size, $size
  $g = [Drawing.Graphics]::FromImage($bmp)
  $g.Clear([Drawing.Color]::FromArgb(11, 43, 38))
  $g.Dispose()
  $path = Join-Path $brandDir "welcome-pwa-icon-$size.png"
  $bmp.Save($path, [Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
  Write-Host "Wrote $path"
}
