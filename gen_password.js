const encoder = new TextEncoder();
const data = encoder.encode('admin123' + 'mechta-salt-2024');
const hash = await crypto.subtle.digest('SHA-256', data);

console.log(btoa(String.fromCharCode(...new Uint8Array(hash))))