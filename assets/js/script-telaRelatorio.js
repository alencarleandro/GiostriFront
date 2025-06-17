document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('cardVendas').addEventListener('click', async () => await ApiService.relatorioVendas());
    document.getElementById('cardUsuarios').addEventListener('click', async () => await ApiService.relatorioUsuarios());
    document.getElementById('cardEstoque').addEventListener('click', async () => await ApiService.relatorioEstoque());
});
