import { Component, ElementRef, ViewChild, TemplateRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';


@Component({
  selector: 'app-atributos-faciales',
  templateUrl: './atributos-faciales.component.html',
  styleUrls: ['./atributos-faciales.component.scss']
})
export class AtributosFacialesComponent {
  @ViewChild('video0') video0!: ElementRef<HTMLVideoElement>;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('imageDialog') imageDialogTemplate!: TemplateRef<any>;
  @ViewChild('loadingDialog') loadingDialogTemplate!: TemplateRef<any>;

  private loadingDialogRef: any;
  imageFile: File | null = null;
  imagePreview: string | null = null;
  imageName: string | null = null;
  result: any = null;
  errorMessage: string = '';
  cameraActive = false;
  stream!: MediaStream;
  selectedImage: string | null = null;

  constructor(private http: HttpClient, private dialog: MatDialog) { }

  onFileSelected(event: any): void {
    this.result = null;
    this.errorMessage = '';

    const file = event.target.files[0];
    if (!file) return;

    this.imageFile = file;
    this.imageName = file.name;

    const reader = new FileReader();
    reader.onload = () => this.imagePreview = reader.result as string;
    reader.readAsDataURL(file);
  }

  startCamera(): void {
    this.cameraActive = true;
    navigator.mediaDevices.getUserMedia({ video: true })
      .then((stream) => {
        this.stream = stream;
        this.video0.nativeElement.srcObject = stream;
      })
      .catch((err) => {
        console.error('No se pudo acceder a la cámara:', err);
      });
  }

  stopCamera(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }
    this.cameraActive = false;
  }

  takePhoto(): void {
    this.result = null;
    this.errorMessage = '';
    const video = this.video0.nativeElement;
    const canvas = document.createElement('canvas');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d')!;
    // ✅ Reflejar horizontalmente para corregir la inversión
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const photoDataUrl = canvas.toDataURL('image/jpeg'); // JPG siempre
    const blob = this.dataURLtoBlob(photoDataUrl);
    const file = new File([blob], `capturada.jpg`, { type: 'image/jpeg' });

    this.imageFile = file;
    this.imagePreview = photoDataUrl;
    this.imageName = null; // Limpiar nombre de archivo anterior

    // Detener cámara
    const stream = video.srcObject as MediaStream;
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }

    this.stopCamera();

  }


  clearImage(): void {
    this.result = null;
    this.errorMessage = '';
    this.imageFile = null;
    this.imagePreview = null;
    this.imageName = null;
    this.fileInput.nativeElement.value = '';
  }

  async analizarFoto() {
    this.result = null;
    this.errorMessage = '';

    if (!this.imagePreview) {
      this.errorMessage = 'Por favor, sube o toma una foto antes de analizar.';
      return;
    }

    this.showLoading();

    try {
      const resizedImage1 = await this.resizeImage(this.imagePreview);

      const body = {
        imagen: resizedImage1
      };

      const headers = { 'Content-Type': 'application/json' };

      const [responserace, responseage, responsegenderemotion] = await Promise.all([
        this.http.post<any>('https://fn-deepface-analyze-race-gyhcavezeve8eucy.eastus2-01.azurewebsites.net/api/analyzerace', body, { headers }).toPromise().catch(e => null),
        this.http.post<any>('https://fn-deepface-analyze-age-hpetdvfxeabkdmcw.eastus2-01.azurewebsites.net/api/analyzeage', body, { headers }).toPromise().catch(e => null),
        this.http.post<any>('https://fn-deepface-analize-genderemotion-bva7aec9f8akgmgh.eastus2-01.azurewebsites.net/api/analyzegenderemotion', body, { headers }).toPromise().catch(e => null)
      ]);
      

      const safeGet = (obj: any, path: string[], fallback: any) => {
        return path.reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj) ?? fallback;
      };

      this.result = {
        analysis: {
          age: safeGet(responseage, ['analysis', 'age'], 0),
          gender: {
            dominant: safeGet(responsegenderemotion, ['analysis', 'gender', 'dominant'], ''),
            confidence: {
              Man: safeGet(responsegenderemotion, ['analysis', 'gender', 'confidence', 'Man'], 0.0),
              Woman: safeGet(responsegenderemotion, ['analysis', 'gender', 'confidence', 'Woman'], 0.0)
            }
          },
          emotion: {
            dominant: safeGet(responsegenderemotion, ['analysis', 'emotion', 'dominant'], ''),
            confidence: safeGet(responsegenderemotion, ['analysis', 'emotion', 'confidence'], {})
          },
          race: {
            dominant: safeGet(responserace, ['analysis', 'race', 'dominant'], ''),
            confidence: {
              asian: safeGet(responserace, ['analysis', 'race', 'confidence', 'asian'], 0),
              indian: safeGet(responserace, ['analysis', 'race', 'confidence', 'indian'], 0),
              black: safeGet(responserace, ['analysis', 'race', 'confidence', 'black'], 0),
              white: safeGet(responserace, ['analysis', 'race', 'confidence', 'white'], 0),
              middle_eastern: safeGet(responserace, ['analysis', 'race', 'confidence', 'middle_eastern'], 0),
              latino_hispanic: safeGet(responserace, ['analysis', 'race', 'confidence', 'latino_hispanic'], 0)
            }
          },
          face_region: {
            x: safeGet(responserace, ['analysis', 'face_region', 'x'], 0),
            y: safeGet(responserace, ['analysis', 'face_region', 'y'], 0),
            w: safeGet(responserace, ['analysis', 'face_region', 'w'], 0),
            h: safeGet(responserace, ['analysis', 'face_region', 'h'], 0),
            confidence: safeGet(responserace, ['analysis', 'face_region', 'confidence'], 0.0)
          }
        }
      };

      //almacenar en BD
      const almacenamientoBody = {
        deepface_funcion: 'deepface_analyze',
        imagen1: resizedImage1,
        resultado_json: JSON.stringify(this.result)
      };
      await this.http.post<any>(
        'https://fn-deepface-bd-cdayg3e5fseehjef.eastus2-01.azurewebsites.net/api/guardar',
        almacenamientoBody,
        { headers: { 'Content-Type': 'application/json' } }
      ).toPromise().catch(e => {
        console.error('Error al guardar en BD:', e);
      });


    } catch (error) {
      console.error('Error al analizar:', error);
      this.result = 'Ocurrió un error al procesar las imágenes.';
    } finally {
      this.closeLoading();
    }
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

  obtenerRazasOrdenadas(confidence: { [key: string]: number }): string[] {
    if (!confidence) return [];
    return Object.keys(confidence).sort((a, b) => confidence[b] - confidence[a]);
  }

  obtenerEmocionesOrdenadas(confidence: { [key: string]: number }): string[] {
    if (!confidence) return [];
    return Object.keys(confidence).sort((a, b) => confidence[b] - confidence[a]);
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


  private dataURLtoBlob(dataURL: string): Blob {
    const byteString = atob(dataURL.split(',')[1]);
    const mimeString = dataURL.split(',')[0].split(':')[1].split(';')[0];
    const byteNumbers = Uint8Array.from(byteString, char => char.charCodeAt(0));
    return new Blob([byteNumbers], { type: mimeString });
  }


  openImageDialog(imageUrl: string): void {
    this.selectedImage = imageUrl;
    this.dialog.open(this.imageDialogTemplate);
  }

  traducirEmocion(emocion: string): string {
    const emociones: { [key: string]: string } = {
      happy: 'Feliz',
      sad: 'Triste',
      angry: 'Enojado',
      neutral: 'Neutral',
      disgust: 'Disgusto',
      fear: 'Miedo',
      surprise: 'Sorpresa'
    };
    return emociones[emocion] || emocion;
  }

  traducirRaza(raza: string): string {
    const razas: { [key: string]: string } = {
      asian: 'Asiático',
      indian: 'Indú',
      black: 'Africano',
      white: 'Europeo',
      middle_eastern: 'Medio Oriente',
      latino_hispanic: 'Latino / Hispano'
    };
    return razas[raza] || raza;
  }

getGeneroTraducido(genero: string): string {
  if (genero === 'Man') return 'Hombre';
  if (genero === 'Woman') return 'Mujer';
  return '';
}  

}