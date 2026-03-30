import axios from 'axios';
import echo from './echo';

window.axios = axios;
window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

// Make echo globally available for debugging
window.Echo = echo;

console.log('Echo initialized:', echo);