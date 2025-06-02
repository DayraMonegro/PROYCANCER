$(document).ready(function () {
  // Cargar datos iniciales y opciones de formulario
  cargarDatos();
  cargarOpcionesFormulario();

  // Función para mostrar notificaciones Toast
  function mostrarToast(mensaje, tipo = 'primary') {
    const toastEl = $('#toastNotificacion');
    const toastBody = $('#toastMensaje');
    toastEl.removeClass('bg-primary bg-success bg-danger bg-warning');
    toastEl.addClass(`bg-${tipo}`);
    toastBody.text(mensaje);
    const toast = new bootstrap.Toast(toastEl[0]);
    toast.show();
  }

  // Cargar datos de la API
  function cargarDatos() {
    $('#tablaCancer tbody').html('<tr><td colspan="9" class="text-center loading">Cargando datos...</td></tr>');
    $.ajax({
      url: "/api/cancer-data",
      method: "GET",
      dataType: "json",
      success: function (jsonData) {
        if (!jsonData || !Array.isArray(jsonData) || jsonData.length === 0) {
          $('#tablaCancer tbody').html('<tr><td colspan="9" class="text-center error">No se encontraron datos.</td></tr>');
          return;
        }
        console.log("Datos recibidos:", jsonData); // Debugging
        cargarTabla(jsonData);
        graficar(jsonData);
      },
      error: function (xhr, status, error) {
        console.error("Error al cargar los datos:", error);
        $('#tablaCancer tbody').html('<tr><td colspan="9" class="text-center error">Error al cargar los datos. Por favor intente más tarde.</td></tr>');
      }
    });
  }

  // Cargar opciones para los formularios
  function cargarOpcionesFormulario() {
    $.ajax({
      url: '/api/cancer_options',
      method: 'GET',
      dataType: 'json',
      success: function (data) {
        llenarCombo('#addCountryRegion', data.country_regions);
        llenarCombo('#addYear', data.years || []);
        llenarCombo('#addCancerType', data.cancer_types);
        llenarCombo('#addCancerStage', data.cancer_stages);
        llenarCombo('#editarCountryRegion', data.country_regions);
        llenarCombo('#editarYear', data.years || []);
        llenarCombo('#editarCancerType', data.cancer_types);
        llenarCombo('#editarCancerStage', data.cancer_stages);
      },
      error: function () {
        console.error("Error al cargar opciones de formulario");
        mostrarToast('Error al cargar opciones', 'danger');
      }
    });
  }

  function llenarCombo(selector, valores) {
    const select = $(selector);
    select.empty();
    select.append('<option value="">-- Seleccione --</option>');
    valores.forEach(v => {
      select.append(`<option value="${v}">${v}</option>`);
    });
  }

  // Cargar tabla
  function cargarTabla(data) {
    const cuerpo = data.map(d => {
      // Validar datos
      if (!d.id || !d.country_region || !d.cancer_type || !d.gender || !d.year || d.age == null) {
        console.warn("Fila inválida, faltan datos:", d);
        return null; // Filtrar filas inválidas
      }
      return [
        d.id,
        d.country_region,
        d.cancer_type,
        d.gender,
        d.year,
        d.age,
        parseFloat(d.genetic_risk || 0).toFixed(2), // Fallback a 0 si null
        parseFloat(d.air_pollution || 0).toFixed(2), // Fallback a 0 si null
        `<button class="btn btn-sm btn-warning btn-editar me-1">
           <i class="fas fa-edit"></i> Editar
         </button>
         <button class="btn btn-sm btn-danger btn-eliminar" data-id="${d.id}">
           <i class="fas fa-trash-alt"></i> Eliminar
         </button>`
      ];
    }).filter(row => row !== null); // Eliminar filas nulas

    console.log("Cuerpo de la tabla:", cuerpo); // Debugging

    // Destruir tabla solo si está inicializada
    if ($.fn.DataTable.isDataTable('#tablaCancer')) {
      $('#tablaCancer').DataTable().clear().destroy();
    }

    $('#tablaCancer').DataTable({
      data: cuerpo,
      columns: [
        { title: "ID", visible: false },
        { title: "País" },
        { title: "Cáncer" },
        { title: "Género" },
        { title: "Año" },
        { title: "Edad" },
        { title: "Riesgo Genético", className: "text-end" },
        { title: "Contaminación", className: "text-end" },
        { title: "Acciones", orderable: false, searchable: false, className: "text-center" }
      ],
      responsive: true,
      language: {
        emptyTable: "No hay datos disponibles en la tabla",
        info: "Mostrando _START_ a _END_ de _TOTAL_ entradas",
        infoEmpty: "Mostrando 0 a 0 de 0 entradas",
        lengthMenu: "Mostrar _MENU_ entradas",
        search: "Buscar:",
        paginate: {
          first: "Primero",
          last: "Último",
          next: "Siguiente",
          previous: "Anterior"
        }
      }
    });
  }

  // Agregar registro
  $('#formAgregar').on('submit', function (e) {
    e.preventDefault();
    const datos = {
      patient_id: this.patient_id.value,
      age: parseInt(this.age.value),
      gender: this.gender.value,
      country_region: this.country_region.value,
      year: parseInt(this.year.value),
      genetic_risk: parseFloat(this.genetic_risk.value),
      air_pollution: parseFloat(this.air_pollution.value),
      cancer_type: this.cancer_type.value,
      cancer_stage: this.cancer_stage.value || '',
      treatment_cost_usd: parseFloat(this.treatment_cost_usd.value) || 0,
      survival_years: parseFloat(this.survival_years.value) || 0,
      target_severity_score: parseFloat(this.target_severity_score.value) || 0
    };

    $.ajax({
      url: '/add/cancer_record',
      method: 'POST',
      contentType: 'application/json',
      data: JSON.stringify(datos),
      success: function (response) {
        $('#modalAgregar').modal('hide');
        this.reset();
        mostrarToast('🩺 Registro agregado con éxito', 'success');
        cargarDatos();
      },
      error: function () {
        mostrarToast('Error al agregar registro', 'danger');
      }
    });
  });

  // Eliminar registro
  $('#tablaCancer').on('click', '.btn-eliminar', function () {
    const id = $(this).data('id');
    if (confirm("¿Estás seguro de eliminar este registro?")) {
      $.ajax({
        url: `/del/cancer_record/${id}`,
        method: 'DELETE',
        success: function () {
          mostrarToast('❌ Registro eliminado', 'danger');
          cargarDatos();
        },
        error: function () {
          mostrarToast('Error al eliminar registro', 'danger');
        }
      });
    }
  });

  // Editar registro
  $('#tablaCancer').on('click', '.btn-editar', function () {
    const row = $(this).closest('tr');
    const data = $('#tablaCancer').DataTable().row(row).data();
    $('#editarId').val(data[0]);
    $('#editarPatientId').val(data[0]); // Asumiendo que patient_id no está en la tabla
    $('#editarCountryRegion').val(data[1]);
    $('#editarCancerType').val(data[2]);
    $('#editarGender').val(data[3]);
    $('#editarYear').val(data[4]);
    $('#editarAge').val(data[5]);
    $('#editarGeneticRisk').val(data[6]);
    $('#editarAirPollution').val(data[7]);

    // Cargar datos adicionales para edición
    $.ajax({
      url: `/api/cancer-data`,
      method: 'GET',
      dataType: 'json',
      success: function (jsonData) {
        const record = jsonData.find(d => d.id === parseInt(data[0]));
        if (record) {
          $('#editarCancerStage').val(record.cancer_stage || '');
          $('#editarTreatmentCost').val(record.treatment_cost_usd || '');
          $('#editarSurvivalYears').val(record.survival_years || '');
          $('#editarTargetSeverityScore').val(record.target_severity_score || '');
        }
        const modal = new bootstrap.Modal(document.getElementById('modalEditar'));
        modal.show();
      }
    });
  });

  // Guardar cambios de edición
  $('#formEditar').on('submit', function (e) {
    e.preventDefault();
    const id = $('#editarId').val();
    const datos = {
      patient_id: $('#editarPatientId').val(),
      age: parseInt($('#editarAge').val()),
      gender: $('#editarGender').val(),
      country_region: $('#editarCountryRegion').val(),
      year: parseInt($('#editarYear').val()),
      genetic_risk: parseFloat($('#editarGeneticRisk').val()),
      air_pollution: parseFloat($('#editarAirPollution').val()),
      cancer_type: $('#editarCancerType').val(),
      cancer_stage: $('#editarCancerStage').val() || '',
      treatment_cost_usd: parseFloat($('#editarTreatmentCost').val()) || 0,
      survival_years: parseFloat($('#editarSurvivalYears').val()) || 0,
      target_severity_score: parseFloat($('#editarTargetSeverityScore').val()) || 0
    };

    $.ajax({
      url: `/upd/cancer_record/${id}`,
      method: 'PUT',
      contentType: 'application/json',
      data: JSON.stringify(datos),
      success: function () {
        $('#modalEditar').modal('hide');
        mostrarToast('✏️ Registro actualizado', 'warning');
        cargarDatos();
      },
      error: function () {
        mostrarToast('Error al actualizar registro', 'danger');
      }
    });
  });

  // Función para sumar valores por propiedad
  function sumBy(arr, prop, filter) {
    return arr.reduce((sum, item) => {
      if (!filter || filter(item)) {
        return sum + (parseFloat(item[prop]) || 0);
      }
      return sum;
    }, 0);
  }

  // Generar gráficos
  function graficar(data) {
    const paises = [...new Set(data.map(item => item.country_region))];
    const tiposCancer = [...new Set(data.map(item => item.cancer_type))];
    const regiones = [...new Set(data.map(item => item.country_region))];
    const años = [...new Set(data.map(item => item.year))];

    // Gráfico 1: Severidad por País
    const ctx1 = document.getElementById('chart1').getContext('2d');
    new Chart(ctx1, {
      type: 'bar',
      data: {
        labels: paises.slice(0, 15),
        datasets: [{
          label: 'Severidad',
          data: paises.slice(0, 15).map(pais => sumBy(data, 'target_severity_score', item => item.country_region === pais)),
          backgroundColor: 'rgba(29, 107, 69, 0.7)',
          borderColor: 'rgb(28, 24, 74)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } }
      }
    });

    // Gráfico 2: Distribución por Tipo de Cáncer
    const ctx2 = document.getElementById('chart2').getContext('2d');
    new Chart(ctx2, {
      type: 'pie',
      data: {
        labels: tiposCancer,
        datasets: [{
          label: 'Severidad',
          data: tiposCancer.map(tipo => sumBy(data, 'target_severity_score', item => item.cancer_type === tipo)),
          backgroundColor: [
            'rgba(156, 39, 176, 0.7)',
            'rgba(0, 84, 153, 0.7)',
            'rgba(10, 62, 11, 0.7)',
            'rgba(117, 79, 22, 0.7)',
            'rgba(80, 6, 1, 0.7)',
            'rgba(53, 79, 228, 0.7)',
            'rgba(0, 150, 136, 0.7)'
          ],
          borderColor: '#ffffff',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { position: 'right' } }
      }
    });

    // Gráfico 3: Severidad por Región
    const ctx3 = document.getElementById('chart3').getContext('2d');
    new Chart(ctx3, {
      type: 'bar',
      data: {
        labels: regiones,
        datasets: [{
          label: 'Severidad',
          data: regiones.map(region => sumBy(data, 'target_severity_score', item => item.country_region === region)),
          backgroundColor: 'rgba(65, 15, 11, 0.7)',
          borderColor: 'rgb(20, 153, 93)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } }
      }
    });

    // Gráfico 4: Proporción por Género
    const ctx4 = document.getElementById('chart4').getContext('2d');
    new Chart(ctx4, {
      type: 'doughnut',
      data: {
        labels: ['Masculino', 'Femenino'],
        datasets: [{
          label: 'Severidad',
          data: [
            sumBy(data, 'target_severity_score', item => item.gender === 'Male'),
            sumBy(data, 'target_severity_score', item => item.gender === 'Female')
          ],
          backgroundColor: ['rgba(123, 26, 145, 0.7)', 'rgba(11, 87, 97, 0.7)'],
          borderColor: '#ffffff',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { position: 'right' } }
      }
    });

    // Gráfico 5: Tendencias Anuales
    const ctx5 = document.getElementById('chart5').getContext('2d');
    new Chart(ctx5, {
      type: 'line',
      data: {
        labels: años,
        datasets: [{
          label: 'Severidad',
          data: años.map(year => sumBy(data, 'target_severity_score', item => item.year == year)),
          borderColor: 'rgb(46, 6, 53)',
          backgroundColor: 'rgba(56, 238, 238, 0.1)',
          borderWidth: 2,
          fill: true
        }]
      },
      options: {
        responsive: true,
        scales: { y: { beginAtZero: false } }
      }
    });

    // Gráfico 6: Top 10 Países con Mayor Severidad
    const paisesConSeveridad = paises.map(pais => ({
      pais,
      severidad: sumBy(data, 'target_severity_score', item => item.country_region === pais)
    })).sort((a, b) => b.severidad - a.severidad).slice(0, 10);

    const ctx6 = document.getElementById('chart6').getContext('2d');
    new Chart(ctx6, {
      type: 'bar',
      data: {
        labels: paisesConSeveridad.map(item => item.pais),
        datasets: [{
          label: 'Severidad',
          data: paisesConSeveridad.map(item => item.severidad),
          backgroundColor: 'rgba(76, 175, 80, 0.7)',
          borderColor: 'rgb(4, 68, 84)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } }
      }
    });

    // Gráfico 7: Relación Severidad vs Costo de Tratamiento
    const ctx7 = document.getElementById('chart7').getContext('2d');
    new Chart(ctx7, {
      type: 'scatter',
      data: {
        datasets: [{
          label: 'Países',
          data: paises.map(pais => ({
            x: sumBy(data, 'target_severity_score', item => item.country_region === pais),
            y: sumBy(data, 'treatment_cost_usd', item => item.country_region === pais),
            r: 10
          })),
          backgroundColor: 'rgba(17, 197, 32, 0.7)',
          borderColor: 'rgb(5, 154, 139)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          x: { title: { display: true, text: 'Severidad' }, beginAtZero: true },
          y: { title: { display: true, text: 'Costo de Tratamiento (USD)' }, beginAtZero: true }
        }
      }
    });

    // Gráfico 8: Distribución por Región
    const ctx8 = document.getElementById('chart8').getContext('2d');
    new Chart(ctx8, {
      type: 'polarArea',
      data: {
        labels: regiones,
        datasets: [{
          label: 'Severidad',
          data: regiones.map(region => sumBy(data, 'target_severity_score', item => item.country_region === region)),
          backgroundColor: [
            'rgba(156, 39, 176, 0.7)',
            'rgba(33, 150, 243, 0.7)',
            'rgba(76, 175, 80, 0.7)',
            'rgba(255, 152, 0, 0.7)',
            'rgba(244, 67, 54, 0.7)'
          ],
          borderColor: '#ffffff',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { position: 'right' } }
      }
    });

    // Gráfico 9: Tipos de Cáncer por Género
    const ctx9 = document.getElementById('chart9').getContext('2d');
    new Chart(ctx9, {
      type: 'radar',
      data: {
        labels: tiposCancer,
        datasets: [
          {
            label: 'Masculino',
            data: tiposCancer.map(tipo => sumBy(data, 'target_severity_score', item => item.cancer_type === tipo && item.gender === 'Male')),
            backgroundColor: 'rgba(33, 150, 243, 0.2)',
            borderColor: 'rgba(33, 150, 243, 1)',
            borderWidth: 2
          },
          {
            label: 'Femenino',
            data: tiposCancer.map(tipo => sumBy(data, 'target_severity_score', item => item.cancer_type === tipo && item.gender === 'Female')),
            backgroundColor: 'rgba(244, 67, 54, 0.2)',
            borderColor: 'rgba(244, 67, 54, 1)',
            borderWidth: 2
          }
        ]
      },
      options: {
        responsive: true,
        scales: { r: { beginAtZero: true } }
      }
    });

    // Gráfico 10: Costo de Tratamiento por Tipo
    const ctx10 = document.getElementById('chart10').getContext('2d');
    new Chart(ctx10, {
      type: 'bar',
      data: {
        labels: tiposCancer,
        datasets: [{
          label: 'Costo de Tratamiento (USD)',
          data: tiposCancer.map(tipo => sumBy(data, 'treatment_cost_usd', item => item.cancer_type === tipo)),
          backgroundColor: 'rgba(63, 81, 181, 0.7)',
          borderColor: 'rgb(43, 5, 40)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, title: { display: true, text: 'Costo de Tratamiento (USD)' } }
        }
      }
    });
  }
});