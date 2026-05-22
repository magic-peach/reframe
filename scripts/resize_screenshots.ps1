Add-Type -AssemblyName System.Drawing

$publicDir = "c:\Users\verma\reframe\public\screenshots"
$desktopSrc = "$publicDir\desktop.png"
$mobileSrc = "$publicDir\mobile.png"

# Verify they exist
if (-not (Test-Path $desktopSrc) -or -not (Test-Path $mobileSrc)) {
    Write-Error "Source screenshots not found!"
    exit 1
}

# 1. Desktop: Crop 1024x1024 to 1024x576, then resize to 1280x720
Write-Host "Processing desktop screenshot..."
$bmpDesktopSrc = New-Object System.Drawing.Bitmap($desktopSrc)
$bmpDesktopDest = New-Object System.Drawing.Bitmap(1280, 720)
$graphDesktop = [System.Drawing.Graphics]::FromImage($bmpDesktopDest)

# Settings
$graphDesktop.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$graphDesktop.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$graphDesktop.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$graphDesktop.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

# Source crop rectangle: 16:9 from center
# Width: 1024, Height: 576. Y offset: (1024-576)/2 = 224
$srcRectDesktop = New-Object System.Drawing.Rectangle(0, 224, 1024, 576)
$destRectDesktop = New-Object System.Drawing.Rectangle(0, 0, 1280, 720)

$graphDesktop.DrawImage($bmpDesktopSrc, $destRectDesktop, $srcRectDesktop, [System.Drawing.GraphicsUnit]::Pixel)

$graphDesktop.Dispose()
$bmpDesktopSrc.Dispose()

# Delete old and save new
if (Test-Path $desktopSrc) { Remove-Item $desktopSrc -Force }
$bmpDesktopDest.Save($desktopSrc, [System.Drawing.Imaging.ImageFormat]::Png)
$bmpDesktopDest.Dispose()
Write-Host "Desktop screenshot processed successfully!"

# 2. Mobile: Crop 1024x1024 to 576x1024, then resize to 720x1280
Write-Host "Processing mobile screenshot..."
$bmpMobileSrc = New-Object System.Drawing.Bitmap($mobileSrc)
$bmpMobileDest = New-Object System.Drawing.Bitmap(720, 1280)
$graphMobile = [System.Drawing.Graphics]::FromImage($bmpMobileDest)

# Settings
$graphMobile.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$graphMobile.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$graphMobile.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$graphMobile.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

# Source crop rectangle: 9:16 from center
# Height: 1024, Width: 576. X offset: (1024-576)/2 = 224
$srcRectMobile = New-Object System.Drawing.Rectangle(224, 0, 576, 1024)
$destRectMobile = New-Object System.Drawing.Rectangle(0, 0, 720, 1280)

$graphMobile.DrawImage($bmpMobileSrc, $destRectMobile, $srcRectMobile, [System.Drawing.GraphicsUnit]::Pixel)

$graphMobile.Dispose()
$bmpMobileSrc.Dispose()

# Delete old and save new
if (Test-Path $mobileSrc) { Remove-Item $mobileSrc -Force }
$bmpMobileDest.Save($mobileSrc, [System.Drawing.Imaging.ImageFormat]::Png)
$bmpMobileDest.Dispose()
Write-Host "Mobile screenshot processed successfully!"
