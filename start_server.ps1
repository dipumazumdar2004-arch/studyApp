# StudySync Static Web Server using native .NET HttpListener
$ports = @(8080, 8081, 8082, 3000, 5000)
$started = $false
$activePort = 8080
$listener = $null

foreach ($port in $ports) {
    $listener = New-Object System.Net.HttpListener
    $listener.Prefixes.Add("http://localhost:$port/")
    try {
        $listener.Start()
        $started = $true
        $activePort = $port
        break
    } catch {
        // Port taken or access denied, try next one
        if ($listener) {
            $listener.Close()
        }
    }
}

if (-not $started) {
    Write-Host "ERROR: Could not start listener on ports 8080, 8081, 8082, 3000, or 5000." -ForegroundColor Red
    Write-Host "Please ensure you have network permissions."
    Read-Host "Press Enter to exit"
    exit
}

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "   StudySync Web Server is now Running    " -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Access the application at:"
Write-Host "👉 http://localhost:$activePort/ " -ForegroundColor Yellow
Write-Host ""
Write-Host "Keep this window open to study. Close it to stop the server."
Write-Host "=========================================="

while ($listener.IsListening) {
    try {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        
        $path = $request.Url.LocalPath
        if ($path -eq "/" -or $path -eq "") { 
            $path = "/index.html" 
        }
        
        $path = $path.Replace("/", "\")
        $filePath = Join-Path (Get-Location).Path $path
        
        if (Test-Path $filePath -PathType Leaf) {
            $bytes = [System.IO.File]::ReadAllBytes($filePath)
            
            if ($filePath.EndsWith(".html")) { $response.ContentType = "text/html; charset=utf-8" }
            elseif ($filePath.EndsWith(".css")) { $response.ContentType = "text/css; charset=utf-8" }
            elseif ($filePath.EndsWith(".js")) { $response.ContentType = "application/javascript; charset=utf-8" }
            elseif ($filePath.EndsWith(".json")) { $response.ContentType = "application/json; charset=utf-8" }
            elseif ($filePath.EndsWith(".png")) { $response.ContentType = "image/png" }
            elseif ($filePath.EndsWith(".svg")) { $response.ContentType = "image/svg+xml" }
            
            $response.Headers.Add("Access-Control-Allow-Origin", "*")
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $response.StatusCode = 404
            $errBytes = [System.Text.Encoding]::UTF8.GetBytes("404 - File Not Found")
            $response.OutputStream.Write($errBytes, 0, $errBytes.Length)
        }
        $response.Close()
    } catch {
        // Suppress connection interruptions
    }
}
