@echo off
REM Set the S3 bucket name, local directory path, and CloudFront distribution ID
SET S3_BUCKET_NAME=medingen-in-new-2025
SET LOCAL_DIR="./build"
SET CLOUDFRONT_DIST_ID=E2NSXBXSO9MM7S
SET AWS_PROFILE=kyra

REM Sync HTML files (short cache, force refresh often)
echo Syncing HTML files with short cache-control...
aws s3 sync %LOCAL_DIR% s3://%S3_BUCKET_NAME% ^
  --exclude "*" --include "*.html" ^
  --cache-control "no-cache, no-store, must-revalidate" ^
  --metadata-directive REPLACE ^
  --profile %AWS_PROFILE%
IF %ERRORLEVEL% NEQ 0 (
    echo Failed to sync HTML files.
    pause
    exit /b 1
)

REM Sync CSS/JS files (long-term cache: 1 year)
echo Syncing CSS/JS files with long cache-control...
aws s3 sync %LOCAL_DIR% s3://%S3_BUCKET_NAME% ^
  --exclude "*" --include "*.css" --include "*.js" ^
  --cache-control "public, max-age=31536000, immutable" ^
  --metadata-directive REPLACE ^
  --profile %AWS_PROFILE%
IF %ERRORLEVEL% NEQ 0 (
    echo Failed to sync CSS/JS files.
    pause
    exit /b 1
)

REM Sync all other assets (images, fonts, etc.) with long cache
echo Syncing images and other assets with long cache-control...
aws s3 sync %LOCAL_DIR% s3://%S3_BUCKET_NAME% ^
  --exclude "*.html" --exclude "*.css" --exclude "*.js" ^
  --cache-control "public, max-age=31536000" ^
  --metadata-directive REPLACE ^
  --profile %AWS_PROFILE%
IF %ERRORLEVEL% NEQ 0 (
    echo Failed to sync assets.
    pause
    exit /b 1
)

REM Invalidate CloudFront cache
echo Invalidating CloudFront cache for distribution: %CLOUDFRONT_DIST_ID%
aws cloudfront create-invalidation --distribution-id %CLOUDFRONT_DIST_ID% --paths "/*"
IF %ERRORLEVEL% NEQ 0 (
    echo Failed to invalidate CloudFront cache.
    pause
    exit /b 1
)

echo Operation completed successfully.
pause
