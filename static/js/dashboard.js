$(document).ready(function() {
  // Inicializar DataTable
  const table = $('#tablaCancer').DataTable({
    ajax: {
      url: '/api/cancer-data',
      dataSrc: '',
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
    const countrySelects = ['#add-country-region', '#edit-country-region'];
    countrySelects.forEach(select => {
      $(select).append(data.country_regions.map(c => `<option value="${c}">${c}</option>`));
    });

    // Poblar tipos de cáncer
    const cancerTypeSelects = ['#add-cancer-type', '#edit-cancer-type'];
    cancerTypeSelects.forEach(select => {
      $(select).append(data.cancer_types.map(c => `<option value="${c}">${c}</option>`));
    });

    // Poblar etapas de cáncer
    const cancerStageSelects = ['#add-cancer-stage', '#edit-cancer-stage'];
    cancerStageSelects.forEach(select => {
      $(select).append(data.cancer_stages.map(s => `<option value="${s}">${s}</option>`));
    });

    // Poblar años (si no hay datos, usar rango estático)
    const yearSelects = ['#add-year', '#edit-year'];
    let years = [];
    if (data.years && data.years.length) {
      years = data.years.sort((a, b) => a - b);
    } else {
      // Rango estático de años (2000-2025)
      for (let y = 2000; y <= 2025; y++) {
        years.push(y);
      }
    }
    yearSelects.forEach(select => {
      $(select).append(years.map(y => `<option value="${y}">${y}</option>`));
    });
  }).fail(function() {
    // Fallback para años si la API falla
    const yearSelects = ['#add-year', '#edit-year'];
    const years = [];
    for (let y = 2000; y <= 2025; y++) {
      years.push(y);
    }
    yearSelects.forEach(select => {
      $(select).append(years.map(y => `<option value="${y}">${y}</option>`));
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
        showToast('Error al agregar registro: ' + (xhr.responseJSON?.error || 'Desconocido'), 'error');
      }
    });
  });

  // Editar registro
  $('#tablaCancer').on('click', '.edit-btn', function() {
    const id = $(this).data('id');
    $.get('/api/cancer-data', function(data) {
      const record = data.find(r => r.id === id);
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
      }
    });
  });

  $('#edit-cancer-form').on('submit', function(e) {
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

  // Inicializar gráficos (ejemplo simple, expandir según necesidades)
  function initCharts() {
    $.get('/api/cancer_by_type', function(data) {
      const ctx = $('#chart2')[0].getContext('2d');
      new Chart(ctx, {
        type: 'bar',
        data: {
          labels: data.map(item => item.cancer_type),
          datasets: [{
            label: 'Casos por Tipo de Cáncer',
            data: data.map(item => item.total),
            backgroundColor: '#007bff'
          }]
        },
        options: {
          responsive: true
        }
      });
    });
  }

  initCharts();
});