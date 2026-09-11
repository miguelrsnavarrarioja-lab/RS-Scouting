// We will replace btnEstadisticasEmergente.onclick
const btnEstadisticasEmergente = document.getElementById('btnEstadisticasEmergente');
if (btnEstadisticasEmergente) {
  btnEstadisticasEmergente.onclick = () => {
    let statsPorComp = player.statsPorCompeticion;
    // ...
