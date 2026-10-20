export function scrollFormToTop(event?: Event): void {
  const button = event?.currentTarget;
  const run = (): void => {
    const sheet = button instanceof HTMLElement ? button.closest('.sheet') : null;
    const form = (sheet?.querySelector('.form') ?? document.querySelector('.sheet .form'));
    if (!(form instanceof HTMLElement)) return;
    const head = form.querySelector('h3, h4, .table-head, .part-head');
    const target = head instanceof HTMLElement ? head : form;
    const pin = document.querySelector('.review-pin');
    const limit = pin instanceof HTMLElement ? pin.getBoundingClientRect().bottom : 65;
    const top = target.getBoundingClientRect().top + window.scrollY - limit;
    window.scrollTo({ top: Math.max(0, top), left: 0, behavior: 'auto' });
  };
  run();
  requestAnimationFrame(run);
  setTimeout(run, 0);
  setTimeout(run, 60);
}
