import { Component } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { AlertController } from "@ionic/angular";
import { IonButton, IonContent, IonHeader, IonInput, IonItem, IonList, IonTitle, IonToolbar } from "@ionic/angular";
import { SecureStorage } from "@lcorg/capacitor-secure-storage";

@Component({
  selector: "app-home",
  templateUrl: "home.page.html",
  styleUrls: ["home.page.scss"],
  standalone: true,
  imports: [FormsModule, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonInput, IonItem, IonList],
})
export class HomePageComponent {
  public getKey = "";
  public setKey = "";
  public setValue = "";
  public removeKey = "";

  constructor(private readonly alertController: AlertController) {}

  async get(key: string): Promise<void> {
    try {
      const result = await SecureStorage.get({ key });
      await this.showResult(result);
    } catch (error: unknown) {
      await this.showError(error);
    }
  }

  async set(key: string, value: string): Promise<void> {
    try {
      await SecureStorage.set({ key, value });
      await this.showSuccess();
    } catch (error: unknown) {
      await this.showError(error);
    }
  }

  async remove(key: string): Promise<void> {
    try {
      await SecureStorage.remove({ key });
      await this.showSuccess();
    } catch (error: unknown) {
      await this.showError(error);
    }
  }

  async keys(): Promise<void> {
    try {
      const result = await SecureStorage.keys();
      await this.showResult(result);
    } catch (error: unknown) {
      await this.showError(error);
    }
  }

  async clear(): Promise<void> {
    try {
      await SecureStorage.clear();
      await this.showSuccess();
    } catch (error: unknown) {
      await this.showError(error);
    }
  }

  private async showResult(result: unknown): Promise<void> {
    const alert = await this.alertController.create({
      header: "Result",
      message: JSON.stringify(result),
      buttons: ["OK"],
    });

    await alert.present();
  }

  private async showSuccess(): Promise<void> {
    const alert = await this.alertController.create({
      header: "Success",
      buttons: ["OK"],
    });

    await alert.present();
  }

  private async showError(error: unknown): Promise<void> {
    const message = error instanceof Error ? error.message : String(error);

    const alert = await this.alertController.create({
      header: "Error",
      message,
      buttons: ["OK"],
    });

    await alert.present();
  }
}
