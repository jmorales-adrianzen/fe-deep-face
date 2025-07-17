import { Component, ElementRef, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { TemplateRef } from '@angular/core';
import { HttpHeaders } from '@angular/common/http';

import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';


@Component({
  selector: 'app-foto-analyzer',
  templateUrl: './foto-analyzer.component.html',
  styleUrls: ['./foto-analyzer.component.scss']
})
export class FotoAnalyzerComponent {
@ViewChild('video0') video0!: ElementRef<HTMLVideoElement>;
@ViewChild('video1') video1!: ElementRef<HTMLVideoElement>;
@ViewChild('loadingDialog') loadingDialogTemplate!: TemplateRef<any>;

  private loadingDialogRef: any;
  imageFiles: File[] = [null, null];
  imagePreviews: string[] = [null, null];
  cameraPhoto: string | null = null;
  result: string = '';
  cameraActive: boolean[] = [false, false];
  //resultMessage: string = '';
  resultData: any = null;  
  validationMessage: string = '';
  isFromCamera: boolean[] = [false, false];


  constructor(private http: HttpClient, private dialog: MatDialog) {}


  onFileSelected(event: any, index: number): void {
    this.resultData = null;
    this.validationMessage = '';
    const file = event.target.files[0];
    if (!file) return;

    this.imageFiles[index] = file;
    this.isFromCamera[index] = false;

    const reader = new FileReader();
    reader.onload = () => {
      this.imagePreviews[index] = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

startCamera(index: number) {
  this.cameraActive[index] = true;
  navigator.mediaDevices.getUserMedia({ video: true })
    .then(stream => {
      const videoElement = index === 0 ? this.video0.nativeElement : this.video1.nativeElement;
      videoElement.srcObject = stream;
    })
    .catch(err => {
      console.error('No se pudo acceder a la cámara:', err);
    });
}


takePhoto(index: number) {
  this.resultData = null;
  this.validationMessage = '';
  const videoElement = index === 0 ? this.video0.nativeElement : this.video1.nativeElement;

  const canvas = document.createElement('canvas');
  canvas.width = videoElement.videoWidth;
  canvas.height = videoElement.videoHeight;

  const ctx = canvas.getContext('2d')!;
  
  // ✅ Reflejar horizontalmente para corregir la inversión
  ctx.translate(canvas.width, 0);
  ctx.scale(-1, 1);

  ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

  const photoDataUrl = canvas.toDataURL('image/jpeg', 0.92); // 92% calidad
  const blob = this.dataURLtoBlob(photoDataUrl);

  this.imageFiles[index] = new File([blob], `photo-${index}.png`, { type: 'image/png' });
  this.imagePreviews[index] = photoDataUrl;
  this.isFromCamera[index] = true;

  // Detener cámara
  const stream = videoElement.srcObject as MediaStream;
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
  }

  this.cameraActive[index] = false;
}

async analizarFotos() {
  this.validationMessage = '';
  this.resultData = null;

  if (!this.imagePreviews[0] || !this.imagePreviews[1]) {
    this.validationMessage = 'Por favor, sube o toma una foto en ambas secciones antes de analizar';
    return;
  }

  this.showLoading();

  try {
    const resizedImage1 = await this.resizeImage(this.imagePreviews[0]);
    const resizedImage2 = await this.resizeImage(this.imagePreviews[1]);

    const body = {
      image1: resizedImage1,
      image2: resizedImage2,
      model: 'OpenFace',
      threshold: 0.5
    };

    const response = await this.http.post<any>('https://fn-deepface-verify-epbzg0hugjdfcnhw.eastus2-01.azurewebsites.net/api/verify', body, {
      headers: { 'Content-Type': 'application/json' }
    }).toPromise();

    this.resultData = response;
    this.validationMessage = '';
  } catch (error) {
    console.error('Error al analizar:', error);
    this.resultData = 'Ocurrió un error al procesar las imágenes.';
  } finally {
    this.closeLoading();
  }
}


private dataURLtoBlob(dataURL: string): Blob {
  const byteString = atob(dataURL.split(',')[1]);
  const mimeString = dataURL.split(',')[0].split(':')[1].split(';')[0];
  const byteNumbers = Uint8Array.from(byteString, char => char.charCodeAt(0));
  return new Blob([byteNumbers], { type: mimeString });
}

selectedImage: string | null = null;

clearImage(index: number, fileInput: HTMLInputElement): void {
  this.resultData = null;
  this.validationMessage = '';
  this.imageFiles[index] = null!;
  this.imagePreviews[index] = null!;
  this.cameraActive[index] = false;
  fileInput.value = ''; // ✅ Limpia el campo input
}

openImageDialog(imageUrl: string): void {
  this.selectedImage = imageUrl;
  this.dialog.open(this.imageDialogTemplate);
}


private fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

private resizeImage(base64: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      // No escalar si ya es suficientemente pequeño
      if (width < 300 && height < 300) {
        return resolve(base64);
      }

      // Escalar para que el lado menor sea 300px y el otro proporcional
      if (width < height) {
        const scaleFactor = 300 / width;
        width = 300;
        height = Math.round(height * scaleFactor);
      } else {
        const scaleFactor = 300 / height;
        height = 300;
        width = Math.round(width * scaleFactor);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, width, height);

      // Convertir a JPEG con calidad 0.9
      const resizedBase64 = canvas.toDataURL('image/jpeg', 0.9);
      resolve(resizedBase64);
    };

    img.onerror = (e) => {
      console.error('Error al cargar imagen para redimensionar', e);
      resolve(base64); // Si falla, se usa la imagen original
    };

    img.src = base64;
  });
}

 // 👇 Mostrar el diálogo de carga
  showLoading() {
    this.loadingDialogRef = this.dialog.open(this.loadingDialogTemplate, {
      disableClose: true
    });
  }

  // 👇 Cerrar el diálogo de carga
  closeLoading() {
    if (this.loadingDialogRef) {
      this.loadingDialogRef.close();
      this.loadingDialogRef = null;
    }
  }


@ViewChild('imageDialog') imageDialogTemplate!: TemplateRef<any>;
@ViewChild('loadingDialog') loadingDialog!: TemplateRef<any>;

}