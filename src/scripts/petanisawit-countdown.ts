/**
 * The petanisawit "promo ends in" rings: a duration that starts when the page
 * loads, as Berdu's duration countdown did. Each ring fills with what is left
 * of its unit.
 */
for (const box of document.querySelectorAll<HTMLElement>('[data-countdown]')) {
  const end = Date.now() + Number(box.dataset.countdown) * 1000;
  const set = (unit: string, value: number, of: number) => {
    const text = box.querySelector(`[data-value="${unit}"]`);
    const ring = box.querySelector<SVGCircleElement>(`[data-ring="${unit}"]`);
    if (text) text.textContent = String(value);
    if (ring) ring.style.strokeDashoffset = String(100 - (value / of) * 100);
  };
  const tick = () => {
    const left = Math.max(0, Math.round((end - Date.now()) / 1000));
    set('h', Math.floor(left / 3600), 24);
    set('m', Math.floor((left % 3600) / 60), 60);
    set('s', left % 60, 60);
    if (left > 0) setTimeout(tick, 1000);
  };
  tick();
}
