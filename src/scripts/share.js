export function shareOnTwitter(text, url) {
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
  window.open(twitterUrl, '_blank', 'width=550,height=420');
}

export function shareOnFacebook(url) {
  const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
  window.open(fbUrl, '_blank', 'width=550,height=420');
}

export function shareGeneric(title, text, url) {
  if (navigator.share) {
    navigator.share({ title, text, url }).catch(() => {});
  } else {
    copyLink(url);
  }
}

export function copyLink(url) {
  navigator.clipboard.writeText(url).then(() => {
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-4 right-4 bg-navy-800 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-fade-in';
    toast.textContent = 'Link copied!';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
  });
}
