class FooterRegion {
  constructor(apiUrl) {
    this.apiUrl = apiUrl;
    this.footerRegionElement = document.querySelector('.footer-region');
    this.init();
  }

  async fetchData() {
    try {
      const response = await fetch(this.apiUrl);
      const data = await response.json();
      return data.regionName || 'Unknown';
    } catch (error) {
      console.error('Error fetching data:', error);
      return 'Unknown';
    }
  }

  async updateRegion() {
    const region = await this.fetchData();
    this.footerRegionElement.innerHTML = `<i class="fas fa-location-dot"></i> Region: ${region}`;
  }

  async init() {
    await this.updateRegion();
  }
}

const apiUrl = 'https://freeipapi.com/api/json/';
const footerRegion = new FooterRegion(apiUrl);

// batas disini
document.getElementById('uploadForm').addEventListener('submit', function (event) {
  event.preventDefault();
  var form = event.target;
  var formData = new FormData(form);

  Swal.fire({
    title: 'Set Expiration',
    text: 'Do you want to set a 7 day expiration date for this file?',
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Set',
    cancelButtonText: 'No',
    buttonsStyling: false,
    customClass: {
      confirmButton: 'btn btn-primary',
      cancelButton: 'btn btn-secondary',
      actions: 'mt-4',
    },
  }).then((result) => {
    if (result.isConfirmed) {
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 7);
      formData.append('expirationDate', expirationDate.toISOString());
    }

    Swal.fire({
      title: 'Uploading Media',
      text: 'Please wait, the media is being uploaded...',
      icon: 'info',
      allowOutsideClick: false,
      showConfirmButton: false,
    });

    fetch(form.action, {
      method: form.method,
      body: formData,
    })
      .then((response) => response.text())
      .then((data) => {
        const fileUrl = data;

        Swal.close();
        Swal.fire({
          title: 'File successfully uploaded!',
          icon: 'success',
          confirmButtonText: 'Copy',
          showCancelButton: true,
          cancelButtonText: 'Close',
          buttonsStyling: false,
          customClass: {
            confirmButton: 'btn btn-primary',
            cancelButton: 'btn btn-secondary',
            actions: 'mt-4',
          },
        }).then((result) => {
          if (result.isConfirmed) {
            navigator.clipboard.writeText(fileUrl);
            Swal.fire({
              title: 'File link successfully copied!',
              text: fileUrl,
              icon: 'success',
              confirmButtonText: 'OK',
              buttonsStyling: false,
              customClass: {
                confirmButton: 'btn btn-primary',
              },
            });
          }
        });
      })
      .catch((error) => {
        Swal.close();
        Swal.fire({
          title: 'An error occurred while uploading the file!',
          text: error.message,
          icon: 'error',
          confirmButtonText: 'OK',
          buttonsStyling: false,
          customClass: {
            confirmButton: 'btn btn-primary',
          },
        });
      });
  });
});

document.getElementById('file').addEventListener('change', function (event) {
  var input = event.target;
  var previewElement = document.getElementById('filePreview');
  previewElement.innerHTML = '';

  if (input.files && input.files[0]) {
    var reader = new FileReader();

    reader.onload = function (e) {
      if (input.files[0].type.startsWith('image')) {
        var img = document.createElement('img');
        img.src = e.target.result;
        img.className = 'preview';
        previewElement.appendChild(img);
      } else if (input.files[0].type.startsWith('audio')) {
        var audio = document.createElement('audio');
        audio.src = e.target.result;
        audio.controls = true;
        audio.className = 'preview';
        previewElement.appendChild(audio);
      } else if (input.files[0].type.startsWith('video')) {
        var video = document.createElement('video');
        video.src = e.target.result;
        video.controls = true;
        video.className = 'preview';
        previewElement.appendChild(video);
      }
    };

    reader.readAsDataURL(input.files[0]);
  }
});
