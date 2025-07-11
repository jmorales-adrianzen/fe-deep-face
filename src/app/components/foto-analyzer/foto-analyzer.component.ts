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

  imageFiles: File[] = [null, null];
  imagePreviews: string[] = [null, null];
  cameraPhoto: string | null = null;
  result: string = '';
  cameraActive: boolean[] = [false, false];
  resultMessage: string = '';
  resultData: any = null;  
  validationMessage: string = '';
  isFromCamera: boolean[] = [false, false];


  constructor(private http: HttpClient, private dialog: MatDialog) {}

  onFileSelected(event: any, index: number): void {
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
  const videoElement = index === 0 ? this.video0.nativeElement : this.video1.nativeElement;

  const canvas = document.createElement('canvas');
  canvas.width = videoElement.videoWidth;
  canvas.height = videoElement.videoHeight;

  const ctx = canvas.getContext('2d')!;
  
  // ✅ Reflejar horizontalmente para corregir la inversión
  ctx.translate(canvas.width, 0);
  ctx.scale(-1, 1);

  ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

  const photoDataUrl = canvas.toDataURL('image/png');
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


analizarFotos() {
  this.validationMessage = '';
  this.result = '';
  this.resultData = null;

  if (!this.imagePreviews[0] || !this.imagePreviews[1]) {
    this.validationMessage = 'Por favor, sube o toma una foto en ambas secciones antes de analizar.';
    return;
  }

  const image1Base64 = this.imagePreviews[0];
  const image2Base64 = this.imagePreviews[1];

  const payload = {
    image1: image1Base64,
    image2: image2Base64,
    model: 'OpenFace',
    threshold: 0.5
  };

  const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
  const dialogRef = this.dialog.open(this.loadingDialog, { disableClose: true });

  this.http.post<any>('https://fn-deep-face-chczfwd4dvhdh2eh.eastus2-01.azurewebsites.net/api/verifymetodo', payload, { headers }).subscribe({
    next: (res) => {
      this.resultData = res;
      dialogRef.close();
    },
    error: (err) => {
      console.error('Error al analizar:', err);
      this.result = 'Error al analizar las imágenes.';
      dialogRef.close();
    }
  });
}

private dataURLtoBlob(dataURL: string): Blob {
  const byteString = atob(dataURL.split(',')[1]);
  const mimeString = dataURL.split(',')[0].split(':')[1].split(';')[0];
  const byteNumbers = Uint8Array.from(byteString, char => char.charCodeAt(0));
  return new Blob([byteNumbers], { type: mimeString });
}

selectedImage: string | null = null;

clearImage(index: number, fileInput: HTMLInputElement): void {
  this.imageFiles[index] = null!;
  this.imagePreviews[index] = null!;
  this.cameraActive[index] = false;
  fileInput.value = ''; // ✅ Limpia el campo input
}

openImageDialog(imageUrl: string): void {
  this.selectedImage = imageUrl;
  this.dialog.open(this.imageDialogTemplate);
}

@ViewChild('imageDialog') imageDialogTemplate!: TemplateRef<any>;

private fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

@ViewChild('loadingDialog') loadingDialog!: TemplateRef<any>;


}