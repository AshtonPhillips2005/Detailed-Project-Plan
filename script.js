const darkMode = document.getElementById('drk-toggle');

darkMode.addEventListener('click', function () {
    document.body.classList.toggle('dark-theme');
    if (document.body.classList.contains('dark-theme')) {
        darkMode.textContent = 'Light mode';
    } else {
        darkMode.textContent = 'Dark mode';
    }
});
