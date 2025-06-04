$(document).ready(function() {
  // Inicializar DataTable
  const table = $('#tablaCancer').DataTable({
    ajax: {
      url: '/api/cancer-data',
      dataSrc: function(json) {
        if (!json || !Array.isArray(json)) {
          console.error('Datos inválidos de /api/cancer-data:', json);
          showToast('Error al cargar datos de la tabla.', 'error');
          return [];
        }
        return json;
      },
      error: function(xhr) {
        console.error('Error en la solicitud /api/cancer-data:', xhr);
        showToast('Error al cargar datos de la tabla: ' + (xhr.responseJSON?.error || 'Desconocido'), 'error');
      }
    },
    columns: [
      { data: 'id' },
      { data: 'country_region' },
      { data: 'cancer_type' },
      { data: 'gender' },
      { data: 'year' },
      { data: 'age' },
      { data: 'genetic_risk' },
      { data: 'air_pollution' },
      {
        data: null,
        render: function(data, type, row) {
          return `
            <button class="btn btn-sm btn-warning edit-btn" data-id="${row.id}">Editar</button>
            <button class="btn btn-sm btn-danger delete-btn" data-id="${row.id}">Eliminar</button>
          `;
        }
      }
    ],
    responsive: true
  });

  // Cargar opciones para selectores
  $.get('/api/cancer_options', function(data) {
    // Poblar países
    const countrySelects = ['#country-region', '#edit-country-region'];
    countrySelects.forEach(select => {
      $(select).empty().append('<option value="">-- Selecciona --</option>')
               .append(data.country_regions?.map(c => `<option value="${c}">${c}</option>`) || []);
    });

    // Poblar tipos de cáncer
    const cancerTypeSelects = ['#cancer-type', '#edit-cancer-type'];
    cancerTypeSelects.forEach(select => {
      $(select).empty().append('<option value="">-- Selecciona --</option>')
               .append(data.cancer_types?.map(c => `<option value="${c}">${c}</option>`) || []);
    });

    // Poblar etapas de cáncer
    const cancerStageSelects = ['#cancer-stage', '#edit-cancer-stage'];
    cancerStageSelects.forEach(select => {
      $(select).empty().append('<option value="">-- Selecciona --</option>')
               .append(data.cancer_stages?.map(s => `<option value="${s}">${s}</option>`) || []);
    });

    // Poblar años
    const yearSelects = ['#year', '#edit-year'];
    let years = [];
    if (data.years && data.years.length) {
      years = data.years.sort((a, b) => a - b);
    } else {
      for (let y = 2000; y <= 2025; y++) {
        years.push(y);
      }
    }
    yearSelects.forEach(select => {
      $(select).empty().append('<option value="">-- Selecciona --</option>')
               .append(years.map(y => `<option value="${y}">${y}</option>`));
    });
  }).fail(function(xhr) {
    console.error('Error en /api/cancer_options:', xhr);
    // Fallback para años
    const yearSelects = ['#year', '#edit-year'];
    const years = [];
    for (let y = 2000; y <= 2025; y++) {
      years.push(y);
    }
    yearSelects.forEach(select => {
      $(select).empty().append('<option value="">-- Selecciona --</option>')
               .append(years.map(y => `<option value="${y}">${y}</option>`));
    });
    showToast('Error al cargar opciones. Usando valores predeterminados.', 'error');
  });

  // Agregar registro
  $('#add-cancer-form').on('submit', function(e) {
    e.preventDefault();
    const data = $(this).serializeObject();
    $.ajax({
      url: '/add/cancer_record',
      type: 'POST',
      contentType: 'application/json',
      data: JSON.stringify(data),
      success: function(response) {
        $('#modalAgregar').modal('hide');
        table.ajax.reload();
        showToast('Registro de cáncer agregado correctamente.', 'success');
      },
      error: function(xhr) {
        console.error('Error al agregar registro:', xhr);
        showToast('Error al agregar registro: ' + (xhr.responseJSON?.error || 'Desconocido'), 'error');
      }
    });
  });

  // Editar registro
  $('#tablaCancer').on('click', '.edit-btn', function() {
    const id = $(this).data('id');
    // Usar datos de la tabla como respaldo temporal
    const row = table.rows().data().toArray().find(r => r.id == id);
    if (row) {
      $('#edit-id').val(row.id);
      $('#edit-patient-id').val(row.patient_id);
      $('#edit-age').val(row.age);
      $('#edit-gender').val(row.gender);
      $('#edit-country-region').val(row.country_region);
      $('#edit-year').val(row.year);
      $('#edit-genetic-risk').val(row.genetic_risk);
      $('#edit-air-pollution').val(row.air_pollution);
      $('#edit-alcohol-use').val(row.alcohol_use);
      $('#edit-smoking').val(row.smoking);
      $('#edit-obesity-level').val(row.obesity_level);
      $('#edit-cancer-type').val(row.cancer_type);
      $('#edit-cancer-stage').val(row.cancer_stage);
      $('#edit-treatment-cost').val(row.treatment_cost_usd);
      $('#edit-survival-years').val(row.survival_years);
      $('#edit-severity-score').val(row.target_severity_score);
      $('#modalEditar').modal('show');
    } else {
      // Intentar con AJAX si el endpoint está disponible
      $.get(`/api/cancer-data/${id}`, function(record) {
        if (record) {
          $('#edit-id').val(record.id);
          $('#edit-patient-id').val(record.patient_id);
          $('#edit-age').val(record.age);
          $('#edit-gender').val(record.gender);
          $('#edit-country-region').val(record.country_region);
          $('#edit-year').val(record.year);
          $('#edit-genetic-risk').val(record.genetic_risk);
          $('#edit-air-pollution').val(record.air_pollution);
          $('#edit-alcohol-use').val(record.alcohol_use);
          $('#edit-smoking').val(record.smoking);
          $('#edit-obesity-level').val(record.obesity_level);
          $('#edit-cancer-type').val(record.cancer_type);
          $('#edit-cancer-stage').val(record.cancer_stage);
          $('#edit-treatment-cost').val(record.treatment_cost_usd);
          $('#edit-survival-years').val(record.survival_years);
          $('#edit-severity-score').val(record.target_severity_score);
          $('#modalEditar').modal('show');
        } else {
          showToast('Registro no encontrado.', 'error');
        }
      }).fail(function(xhr) {
        console.error('Error al cargar registro:', xhr);
        showToast('Error al cargar registro: Registro no encontrado en el servidor.', 'error');
      });
    }
  });

  $('#editar-form').on('submit', function(e) {
    e.preventDefault();
    const id = $('#edit-id').val();
    const data = $(this).serializeObject();
    $.ajax({
      url: `/upd/cancer_record/${id}`,
      type: 'PUT',
      contentType: 'application/json',
      data: JSON.stringify(data),
      success: function(response) {
        $('#modalEditar').modal('hide');
        table.ajax.reload();
        showToast('Registro de cáncer actualizado correctamente.', 'success');
      },
      error: function(xhr) {
        console.error('Error al actualizar registro:', xhr);
        showToast('Error al actualizar registro: ' + (xhr.responseJSON?.error || 'Desconocido'), 'error');
      }
    });
  });

  // Eliminar registro
  $('#tablaCancer').on('click', '.delete-btn', function() {
    const id = $(this).data('id');
    if (confirm('¿Estás seguro de eliminar este registro?')) {
      $.ajax({
        url: `/del/cancer_record/${id}`,
        type: 'DELETE',
        success: function(response) {
          table.ajax.reload();
          showToast('Registro de cáncer eliminado correctamente.', 'success');
        },
        error: function(xhr) {
          console.error('Error al eliminar registro:', xhr);
          showToast('Error al eliminar registro: ' + (xhr.responseJSON?.error || 'Desconocido'), 'error');
        }
      });
    }
  });

  // Función para mostrar notificaciones
  function showToast(message, type) {
    const toast = $('#toastNotificacion');
    $('#toastMensaje').text(message);
    toast.removeClass('bg-success bg-danger').addClass(`bg-${type === 'success' ? 'success' : 'danger'}`);
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
  }

  // Helper para serializar formularios a objetos
  $.fn.serializeObject = function() {
    const obj = {};
    const arr = this.serializeArray();
    arr.forEach(item => {
      obj[item.name] = item.value;
    });
    return obj;
  };

  // Inicializar gráficos
  function initCharts() {
    // Chart 1: Severidad por Región (Top 15)
    const ctx1 = $('#chart1')[0].getContext('2d');
    new Chart(ctx1, {
      type: 'bar',
      data: {
        labels: ['USA', 'Mexico', 'Brazil', 'Canada', 'Argentina'],
        datasets: [{
          label: 'Severidad',
          data: [50, 30, 20, 25, 15],
          backgroundColor: '#007bff'
        }]
      },
      options: {
        responsive: true,
        scales: { y: { beginAtZero: true } }
      }
    });

    // Chart 2: Distribución por Tipo de Cáncer
    $.get('/api/cancer_by_type', function(data) {
      const ctx2 = $('#chart2')[0].getContext('2d');
      new Chart(ctx2, {
        type: 'bar',
        data: {
          labels: data.map(item => item.cancer_type) || ['Lung', 'Breast', 'Prostate'],
          datasets: [{
            label: 'Casos por Tipo de Cáncer',
            data: data.map(item => item.total) || [100, 80, 60],
            backgroundColor: '#007bff'
          }]
        },
        options: {
          responsive: true,
          scales: { y: { beginAtZero: true } }
        }
      });
    }).fail(function(xhr) {
      console.error('Error en chart2:', xhr);
      showToast('Error al cargar gráfico 2.', 'error');
    });

    // Chart 3: Severidad por Región
    const ctx3 = $('#chart3')[0].getContext('2d');
    new Chart(ctx3, {
      type: 'pie',
      data: {
        labels: ['USA', 'Mexico', 'Brazil'],
        datasets: [{
          label: 'Severidad',
          data: [50, 30, 20],
          backgroundColor: ['#007bff', '#28a745', '#dc3545']
        }]
      },
      options: { responsive: true }
    });

    // Chart 4: Proporción de Casos por Género
    const ctx4 = $('#chart4')[0].getContext('2d');
    new Chart(ctx4, {
      type: 'pie',
      data: {
        labels: ['Male', 'Female'],
        datasets: [{
          label: 'Casos por Género',
          data: [60, 40],
          backgroundColor: ['#007bff', '#ff69b4']
        }]
      },
      options: { responsive: true }
    });

    // Chart 5: Tendencias Anuales
    const ctx5 = $('#chart5')[0].getContext('2d');
    new Chart(ctx5, {
      type: 'line',
      data: {
        labels: ['2020', '2021', '2022', '2023', '2024'],
        datasets: [{
          label: 'Casos Anuales',
          data: [100, 120, 130, 110, 140],
          borderColor: '#007bff',
          fill: false
        }]
      },
      options: {
        responsive: true,
        scales: { y: { beginAtZero: true } }
      }
    });

    // Chart 6: Top 10 Países con Mayor Severidad
    const ctx6 = $('#chart6')[0].getContext('2d');
    new Chart(ctx6, {
      type: 'bar',
      data: {
        labels: ['USA', 'Mexico', 'Brazil', 'Canada', 'Argentina'],
        datasets: [{
          label: 'Severidad',
          data: [70, 50, 40, 30, 20],
          backgroundColor: '#007bff'
        }]
      },
      options: {
        responsive: true,
        scales: { y: { beginAtZero: true } }
      }
    });

    // Chart 7: Relación Severidad vs Costo de Tratamiento
    const ctx7 = $('#chart7')[0].getContext('2d');
    new Chart(ctx7, {
      type: 'scatter',
      data: {
        datasets: [{
          label: 'Severidad vs Costo',
          data: [{x: 50, y: 1000}, {x: 70, y: 1500}, {x: 30, y: 800}],
          backgroundColor: '#007bff'
        }]
      },
      options: {
        responsive: true,
        scales: {
          x: { title: { display: true, text: 'Severidad' } },
          y: { title: { display: true, text: 'Costo (USD)' }, beginAtZero: true }
        }
      }
    });

    // Chart 8: Distribución por Región
    const ctx8 = $('#chart8')[0].getContext('2d');
    new Chart(ctx8, {
      type: 'doughnut',
      data: {
        labels: ['North America', 'South America', 'Europe'],
        datasets: [{
          label: 'Distribución',
          data: [50, 30, 20],
          backgroundColor: ['#007bff', '#28a745', '#dc3545']
        }]
      },
      options: { responsive: true }
    });

    // Chart 9: Tipos de Cáncer por Género
    const ctx9 = $('#chart9')[0].getContext('2d');
    new Chart(ctx9, {
      type: 'bar',
      data: {
        labels: ['Lung', 'Breast', 'Prostate'],
        datasets: [
          {
            label: 'Male',
            data: [60, 20, 50],
            backgroundColor: '#007bff'
          },
          {
            label: 'Female',
            data: [30, 70, 10],
            backgroundColor: '#ff69b4'
          }
        ]
      },
      options: {
        responsive: true,
        scales: { y: { beginAtZero: true } }
      }
    });

    // Chart 10: Costo de Tratamiento por Tipo
    const ctx10 = $('#chart10')[0].getContext('2d');
    new Chart(ctx10, {
      type: 'bar',
      data: {
        labels: ['Lung', 'Breast', 'Prostate'],
        datasets: [{
          label: 'Costo de Tratamiento (USD)',
          data: [1500, 1200, 1000],
          backgroundColor: '#007bff'
        }]
      },
      options: {
        responsive: true,
        scales: { y: { beginAtZero: true } }
      }
    });
  }

  initCharts();
});