/** Saves a blob as a file. The object URL is revoked late so Safari does not cancel the download. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

type SavePicker = (o: unknown) => Promise<{ createWritable: () => Promise<{ write: (d: string) => Promise<void>; close: () => Promise<void> }> }>;

/**
 * 백업 파일을 저장한다. 저장 창을 지원하는 브라우저(데스크톱 Chrome 등)에서는 실제로 저장했을 때만 true,
 * 취소하면 false. 지원하지 않는 브라우저는 다운로드를 시작하고 true를 돌려준다(성공 여부는 확인할 수 없다).
 */
export async function saveBackup(text: string, filename: string): Promise<boolean> {
  const picker = (window as unknown as { showSaveFilePicker?: SavePicker }).showSaveFilePicker;
  if (typeof picker === 'function') {
    try {
      const handle = await picker.call(window, { suggestedName: filename, types: [{ description: '라이프 RPG 저장 파일', accept: { 'application/json': ['.json'] } }] });
      const writable = await handle.createWritable();
      await writable.write(text);
      await writable.close();
      return true;
    } catch (e) {
      if ((e as { name?: string }).name === 'AbortError') return false;
      // 그 밖의 오류(권한 등)는 일반 다운로드로 대체한다
    }
  }
  downloadBlob(new Blob([text], { type: 'application/json' }), filename);
  return true;
}
