import { Notify } from 'quasar';

class NotifyHandler {
  constructor() {
    Notify.registerType('info', {
      icon: 'warning',
      progress: true,
      color: 'yellow',
      textColor: 'black',
    });

    Notify.registerType('error', {
      icon: 'error',
      progress: true,
      color: 'red',
      textColor: 'white',
    });

    Notify.registerType('success', {
      icon: 'check_circle_outline',
      progress: true,
      color: 'green',
      textColor: 'white',
    });
  }

  showMessage(type: string, message: string) {
    Notify.create({
      type: type,
      message: message,
    });
  }
}

export default NotifyHandler;
