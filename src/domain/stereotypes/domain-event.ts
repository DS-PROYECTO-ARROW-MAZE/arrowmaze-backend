export abstract class DomainEvent {
  readonly ocurridoEn: Date;

  protected constructor() {
    this.ocurridoEn = new Date();
  }
}
