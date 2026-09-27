export function parseTimeToSeconds(timeStr: string): number {
  if (!timeStr) return 0;
  const cleaned = timeStr.trim();
  
  if (cleaned.includes(':')) {
    const parts = cleaned.split(':');
    if (parts.length === 2) {
      const mins = parseFloat(parts[0]) || 0;
      const secs = parseFloat(parts[1]) || 0;
      return +(mins * 60 + secs).toFixed(2);
    }
  }
  
  const val = parseFloat(cleaned);
  return isNaN(val) ? 0 : +val.toFixed(2);
}

export function formatSecondsToTime(seconds: number): string {
  if (isNaN(seconds) || seconds <= 0) return '00:00.00';
  
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(2);
  const paddedSecs = parseFloat(secs) < 10 ? `0${secs}` : secs;
  
  if (mins > 0) {
    const paddedMins = mins < 10 ? `0${mins}` : `${mins}`;
    return `${paddedMins}:${paddedSecs}`;
  }
  
  return paddedSecs;
}

export function formatTimeDifference(delta: number): { text: string; color: string; isImprovement: boolean } {
  if (Math.abs(delta) < 0.001) {
    return { text: '0.00s (Sama)', color: 'text-slate-400', isImprovement: false };
  }
  
  if (delta < 0) {
    return {
      text: `${delta.toFixed(2)}s (Lebih Cepat)`,
      color: 'text-emerald-400',
      isImprovement: true
    };
  }
  
  return {
    text: `+${delta.toFixed(2)}s (Lebih Lambat)`,
    color: 'text-amber-400',
    isImprovement: false
  };
}
