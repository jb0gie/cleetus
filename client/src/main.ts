import './components/AvatarShowcase';

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const app = document.getElementById('app');
  if (app) {
    const showcase = document.createElement('avatar-showcase');
    app.appendChild(showcase);
  }
});
