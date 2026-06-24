Add-Type -AssemblyName System.Drawing

$sourceImage = "C:\Users\verma\.gemini\antigravity-ide\brain\4edb9a97-81fe-47c8-8ab1-caac8ad98a39\reframe_logo_1779370016792.png"
$publicDir = "c:\Users\verma\reframe\public"

if (-not (Test-Path $sourceImage)) {
    Write-Error "Source image not found at $sourceImage"
    exit 1
}

Write-Host "Loading source image..."
$srcBitmap = New-Object System.Drawing.Bitmap($sourceImage)

# Resize helper function
function Resize-Image {
    param(
        [System.Drawing.Bitmap]$src,
        [int]$width,
        [int]$height,
        [string]$outputPath
    )
    Write-Host "Resizing to $width x $height..."
    $dest = New-Object System.Drawing.Bitmap($width, $height)
    $graphics = [System.Drawing.Graphics]::FromImage($dest)
    
    # Configure high-quality scaling
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    
    # Draw resized
    $graphics.DrawImage($src, 0, 0, $width, $height)
    
    # Save
    $dest.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    
    # Cleanup
    $graphics.Dispose()
    $dest.Dispose()
    Write-Host "Saved to $outputPath"
}

# Create icons
Resize-Image $srcBitmap 192 192 "$publicDir\icon-192.png"
Resize-Image $srcBitmap 512 512 "$publicDir\icon-512.png"

$srcBitmap.Dispose()
Write-Host "All icons generated successfully!"
