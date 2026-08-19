/**
 * Robust file downloader helper for PDFs, CSVs, and JSON files in browser
 */
export const triggerFileDownload = (blobData: any, defaultFilename: string, mimeType: string) => {
  try {
    const blob = new Blob([blobData], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', defaultFilename);
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    
    // Cleanup after short delay to allow browser to register download stream
    setTimeout(() => {
      if (document.body.contains(link)) {
        document.body.removeChild(link);
      }
      window.URL.revokeObjectURL(url);
    }, 300);
  } catch (err) {
    console.error('File download error:', err);
    alert('Download failed. Please ensure popup blocker is disabled.');
  }
};
