/* Dachdecker Landingpage - Form Handling
   Wilhelm-Knapp-Schule Weilburg */

document.addEventListener('DOMContentLoaded', function () {

  // ========== File Upload Handling ==========
  var uploadAreas = document.querySelectorAll('.dach-upload-area');

  uploadAreas.forEach(function (area) {
    var input = area.querySelector('.dach-file-input');
    var fileNameEl = area.querySelector('.dach-file-name');

    // Drag & Drop
    area.addEventListener('dragover', function (e) {
      e.preventDefault();
      area.classList.add('drag-over');
    });

    area.addEventListener('dragleave', function () {
      area.classList.remove('drag-over');
    });

    area.addEventListener('drop', function (e) {
      e.preventDefault();
      area.classList.remove('drag-over');
      if (e.dataTransfer.files.length > 0) {
        input.files = e.dataTransfer.files;
        updateFileName(input, fileNameEl, area);
      }
    });

    // File selection
    input.addEventListener('change', function () {
      updateFileName(input, fileNameEl, area);
    });
  });

  function updateFileName(input, fileNameEl, area) {
    if (input.files && input.files.length > 0) {
      var names = [];
      var totalSize = 0;
      var valid = true;

      for (var i = 0; i < input.files.length; i++) {
        var file = input.files[i];
        names.push(file.name + ' (' + formatFileSize(file.size) + ')');
        totalSize += file.size;

        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
          valid = false;
          alert('Die Datei "' + file.name + '" ist zu groß. Maximale Dateigröße: 5 MB.');
          input.value = '';
          area.classList.remove('has-file');
          fileNameEl.textContent = '';
          return;
        }

        // Validate file type
        var allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
        if (allowedTypes.indexOf(file.type) === -1) {
          valid = false;
          alert('Die Datei "' + file.name + '" hat ein ungültiges Format. Erlaubt: PDF, JPG, PNG.');
          input.value = '';
          area.classList.remove('has-file');
          fileNameEl.textContent = '';
          return;
        }
      }

      if (valid) {
        area.classList.add('has-file');
        fileNameEl.textContent = names.join(', ');
      }
    } else {
      area.classList.remove('has-file');
      fileNameEl.textContent = '';
    }
  }

  function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  // ========== Form Submission ==========
  var form = document.getElementById('dachdeckerAnmeldung');

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      // Validate all required fields
      var requiredFields = form.querySelectorAll('[required]');
      var valid = true;
      var firstInvalid = null;

      requiredFields.forEach(function (field) {
        // Reset styling
        field.style.borderColor = '';
        if (field.type === 'checkbox') {
          field.parentElement.style.color = '';
        }

        if (field.type === 'checkbox') {
          if (!field.checked) {
            valid = false;
            field.parentElement.style.color = '#dc3545';
            if (!firstInvalid) firstInvalid = field;
          }
        } else if (field.type === 'file') {
          if (!field.files || field.files.length === 0) {
            valid = false;
            field.closest('.dach-upload-area').style.borderColor = '#dc3545';
            if (!firstInvalid) firstInvalid = field;
          }
        } else {
          if (!field.value.trim()) {
            valid = false;
            field.style.borderColor = '#dc3545';
            if (!firstInvalid) firstInvalid = field;
          }
        }
      });

      if (!valid) {
        if (firstInvalid) {
          firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        showAlert('Bitte füllen Sie alle Pflichtfelder aus und laden Sie die erforderlichen Dokumente hoch.', 'error');
        return;
      }

      // Build email body from form data
      var emailBody = buildEmailBody();

      // Build mailto link
      var subject = encodeURIComponent('Berufsschul-Anmeldung Dachdecker/in: ' +
        (document.getElementById('azubi-vorname').value || '') + ' ' +
        (document.getElementById('azubi-nachname').value || ''));

      var body = encodeURIComponent(emailBody);

      var mailtoLink = 'mailto:schulleitung@wks-weilburg.de?subject=' + subject + '&body=' + body;

      // Show info about attachments and open mail client
      var hasFiles = false;
      var fileInputs = form.querySelectorAll('.dach-file-input');
      fileInputs.forEach(function (fi) {
        if (fi.files && fi.files.length > 0) hasFiles = true;
      });

      // Show success message with instructions
      showAlert(
        'Die Anmeldedaten werden jetzt in Ihrem E-Mail-Programm geöffnet. ' +
        'Bitte fügen Sie die hochgeladenen Dokumente (Zeugnis, Ausbildungsvertrag' +
        (hasFiles ? ' und ggf. sonstige Dokumente' : '') +
        ') als Anhang in der E-Mail hinzu und senden Sie die E-Mail ab.',
        'success'
      );

      // Open mail client
      window.location.href = mailtoLink;
    });
  }

  function buildEmailBody() {
    var lines = [];
    lines.push('=== ANMELDUNG ZUR BERUFSSCHULE - DACHDECKER/IN ===');
    lines.push('');
    lines.push('--- AUSBILDUNGSBETRIEB ---');
    lines.push('Firmenname: ' + val('betrieb-name'));
    lines.push('Straße: ' + val('betrieb-strasse'));
    lines.push('PLZ/Ort: ' + val('betrieb-plzort'));
    lines.push('Telefon: ' + val('betrieb-telefon'));
    lines.push('E-Mail: ' + val('betrieb-email'));
    lines.push('Ansprechpartner/in: ' + val('betrieb-ansprechpartner'));
    lines.push('Innung: ' + val('betrieb-innung'));
    lines.push('Handwerkskammer: ' + selText('betrieb-hwk'));
    lines.push('');
    lines.push('--- AUSZUBILDENDE/R ---');
    lines.push('Nachname: ' + val('azubi-nachname'));
    lines.push('Vorname: ' + val('azubi-vorname'));
    lines.push('Geburtsdatum: ' + val('azubi-geburtsdatum'));
    lines.push('Geburtsort: ' + val('azubi-geburtsort'));
    lines.push('Straße: ' + val('azubi-strasse'));
    lines.push('PLZ/Ort: ' + val('azubi-plzort'));
    lines.push('Telefon/Mobil: ' + val('azubi-telefon'));
    lines.push('E-Mail: ' + val('azubi-email'));
    lines.push('Staatsangehörigkeit: ' + val('azubi-staatsangehoerigkeit'));
    lines.push('Schulabschluss: ' + selText('azubi-schulabschluss'));
    lines.push('Geschlecht: ' + selText('azubi-geschlecht'));
    lines.push('');
    lines.push('--- AUSBILDUNG ---');
    lines.push('Ausbildungsbeginn: ' + val('ausbildung-beginn'));
    lines.push('Voraussichtliches Ende: ' + val('ausbildung-ende'));
    lines.push('Einschulung in Lehrjahr: ' + selText('ausbildung-lehrjahr'));
    lines.push('Fachrichtung: ' + selText('ausbildung-fachrichtung'));
    lines.push('');
    lines.push('--- BEMERKUNGEN ---');
    lines.push(val('bemerkungen') || '(keine)');
    lines.push('');
    lines.push('--- DOKUMENTE ---');
    lines.push('BITTE DIE FOLGENDEN DOKUMENTE ALS ANHANG BEIFÜGEN:');

    var zeugnis = document.getElementById('upload-zeugnis');
    if (zeugnis && zeugnis.files.length > 0) {
      lines.push('- Zeugnis: ' + zeugnis.files[0].name);
    }
    var vertrag = document.getElementById('upload-vertrag');
    if (vertrag && vertrag.files.length > 0) {
      lines.push('- Ausbildungsvertrag: ' + vertrag.files[0].name);
    }
    var sonstiges = document.getElementById('upload-sonstiges');
    if (sonstiges && sonstiges.files.length > 0) {
      for (var i = 0; i < sonstiges.files.length; i++) {
        lines.push('- Sonstiges: ' + sonstiges.files[i].name);
      }
    }

    lines.push('');
    lines.push('---');
    lines.push('Diese Anmeldung wurde über das Online-Formular der');
    lines.push('Wilhelm-Knapp-Schule Weilburg - Dachdecker-Landingpage gesendet.');

    return lines.join('\n');
  }

  function val(id) {
    var el = document.getElementById(id);
    return el ? el.value : '';
  }

  function selText(id) {
    var el = document.getElementById(id);
    if (!el || el.selectedIndex <= 0) return '';
    return el.options[el.selectedIndex].text;
  }

  function showAlert(message, type) {
    // Remove existing alerts
    var existingAlerts = document.querySelectorAll('.dach-form-alert');
    existingAlerts.forEach(function (a) { a.remove(); });

    var alertEl = document.createElement('div');
    alertEl.className = 'alert dach-form-alert ' + (type === 'error' ? 'alert-danger' : 'alert-success');
    alertEl.style.cssText = type === 'error'
      ? 'background:#f8d7da;color:#721c24;border:1px solid #f5c6cb;'
      : 'background:#d4edda;color:#155724;border:1px solid #c3e6cb;';
    alertEl.textContent = message;

    var formContainer = document.querySelector('.dach-form-container');
    if (formContainer) {
      formContainer.insertBefore(alertEl, formContainer.firstChild);
      alertEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    if (type === 'success') {
      setTimeout(function () {
        alertEl.remove();
      }, 15000);
    } else {
      setTimeout(function () {
        alertEl.remove();
      }, 8000);
    }
  }

  // ========== Scroll animations for Dachdecker-specific cards ==========
  var observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll('.dach-info-card, .dach-zentrum-card, .dach-kontakt-card, .timeline-item').forEach(function (el) {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
  });

});
