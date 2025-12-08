import './index.css';
import useNotifications, { NotificationItem } from '../../hooks/useNotifications';

// Component to display notifications
const Notifications = () => {
  const { notifications } = useNotifications();

  const notifTitle = (n: NotificationItem) => {
    switch (n.type) {
      case 'answer':
        return (
          <div>
            <span>{n.from}</span> answered your question
          </div>
        );
      case 'dm':
        return (
          <div>
            <span>{n.from}</span> sent you a DM
          </div>
        );
      case 'communityNewMember':
        return (
          <div>
            <span>{n.from}</span>
          </div>
        );
      default:
        return <strong>Notification</strong>;
    }
  };

  // const fakenotification: NotificationItem = {
  //   id: 'fake1',
  //   type: 'answer',
  //   from: 'user123',
  //   messagePreview: 'This is a preview of the answer you received...',
  // };

  return (
    <div className='notifications-wrapper'>
      {notifications.map(n => (
        <div key={n.id} className='notification-card'>
          {notifTitle(n)}
          <p>{n.message}</p>
        </div>
      ))}
      {/* <div key={fakenotification.id} className='notification-card'>
        {notifTitle(fakenotification)}
        <p>{fakenotification.messagePreview}</p>
      </div> */}
    </div>
  );
};

export default Notifications;
