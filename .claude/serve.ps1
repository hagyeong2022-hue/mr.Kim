$port = if ($env:PORT) { $env:PORT } else { 9876 }
$root = "C:\Users\mylov\OneDrive\바탕 화면\drive-download-20260401T101903Z-1-001\2-체험용-샘플"
$listener = [System.Net.HttpListener]::new()
$listener.Prefixes.Add("http://localhost:$port/")
try { $listener.Start() } catch { Write-Error "Port $port in use: $_"; exit 1 }
Write-Host "Serving on http://localhost:$port/"
$htmlFile = Get-ChildItem "$env:USERPROFILE\OneDrive" -Filter "*.html" -Recurse -ErrorAction SilentlyContinue | Where-Object { $_.FullName -like "*20260401*" } | Select-Object -First 1 -ExpandProperty FullName
while ($listener.IsListening) {
    $ctx = $listener.GetContext()
    $bytes = [System.IO.File]::ReadAllBytes($htmlFile)
    $ctx.Response.ContentType = 'text/html; charset=utf-8'
    $ctx.Response.ContentLength64 = $bytes.Length
    $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
    $ctx.Response.Close()
}
