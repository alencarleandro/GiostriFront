document.addEventListener("DOMContentLoaded", function() {
    fetch('../componentes/footer.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('footer').innerHTML = data;
        });
});