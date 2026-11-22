export interface WhatsAppChatPhoto {
  src: string;
  width: number;
  height: number;
}

export interface WhatsAppChatMessage {
  from: 'me' | 'them';
  text?: string;
  photo?: WhatsAppChatPhoto;
  time: string;
  read?: boolean;
}

export interface WhatsAppChatData {
  name: string;
  avatar: WhatsAppChatPhoto;
  messages: WhatsAppChatMessage[];
}

type ChatProps = WhatsAppChatData;

/**
 * WhatsApp testimonials for the Petani Sawit (Berdu) Aussie landing pages,
 * transcribed from the merchant's screenshots.
 */
export const formulaBaruChats = {
  fbKarni: {
    name: 'Pak Karni Kalbar',
    avatar: {
      src: '/images/landing/aussie-formulabaru/wa-karni-av.webp',
      width: 96,
      height: 96,
    },
    messages: [
      {
        from: 'me',
        text: 'Halo Pak, Bagaimana hasil penggunaan AUSSIE sejauh ini ?',
        time: '09:43 am',
        read: true,
      },
      {
        from: 'them',
        photo: {
          src: '/images/landing/aussie-formulabaru/wa-karni-ph.webp',
          width: 546,
          height: 295,
        },
        text: 'Mantab Bos ini, dalam 2 bulan Daun kembali Hijau dan sudah tidak ada bercak, makin lebat josss 👍👍👍',
        time: '10:12 am',
      },
      {
        from: 'me',
        text: 'Mantab pak, semoga panenya melimpah 😁👌',
        time: '10:15 am',
        read: false,
      },
    ],
  },
  fbSuroso: {
    name: 'Pak Suroso',
    avatar: {
      src: '/images/landing/aussie-formulabaru/wa-suroso-av.webp',
      width: 96,
      height: 96,
    },
    messages: [
      {
        from: 'me',
        text: 'Halo Pak, Bagaimana hasil penggunaan AUSSIE sejauh ini ?',
        time: '09:43 am',
        read: true,
      },
      {
        from: 'them',
        photo: {
          src: '/images/landing/aussie-formulabaru/wa-suroso-ph.webp',
          width: 546,
          height: 311,
        },
        text: 'Memuaskan, Jamur sudah pada mati, pohon makin subur, mantab hasilnya setelah 3 bulan 👍👍🤪',
        time: '10:22 am',
      },
      {
        from: 'me',
        text: 'Mantab pak, semoga panenya melimpah 😁👌',
        time: '10:25 am',
        read: false,
      },
    ],
  },
  fbAndi: {
    name: 'Pak Andi',
    avatar: {
      src: '/images/landing/aussie-formulabaru/wa-andi-av.webp',
      width: 96,
      height: 96,
    },
    messages: [
      {
        from: 'me',
        text: 'Halo Pak, Bagaimana hasil penggunaan AUSSIE sejauh ini ?',
        time: '09:43 am',
        read: true,
      },
      {
        from: 'them',
        photo: {
          src: '/images/landing/aussie-formulabaru/wa-andi-ph.webp',
          width: 546,
          height: 293,
        },
        text: 'Sangat Josss, sudah panen bos, mantab hasil panen meningkat setelah 5 bulan pakai AUSSIE 👍👍👌',
        time: '12:31 pm',
      },
      {
        from: 'me',
        text: 'Mantab pak, panenya melimpah 😁👌',
        time: '12:33 pm',
        read: false,
      },
    ],
  },
} satisfies Record<string, ChatProps>;

export const busukPucukChats = {
  bpKarni: {
    name: 'Pak Karni Kalbar',
    avatar: {
      src: '/images/landing/aussie-busukpucuk/wa-karni-av.webp',
      width: 96,
      height: 96,
    },
    messages: [
      {
        from: 'me',
        text: 'Bagaimana hasil penggunaan AUSSIE sejauh ini pak ?',
        time: '09:40',
        read: true,
      },
      {
        from: 'them',
        text: 'Mantab Bos, pohon sudah mulai sehat setelah pengaplikasian 3 kali, sudah tidak terlihat busuk pucuk dan mulai tumbuh tunas baru yang sehat 👍👍👍',
        time: '09:41',
      },
      {
        from: 'them',
        photo: {
          src: '/images/landing/aussie-busukpucuk/wa-karni-ph.webp',
          width: 640,
          height: 960,
        },
        time: '09:43',
      },
      {
        from: 'them',
        text: 'Daun menghijau lagi, joss 👍👍',
        time: '09:43',
      },
      {
        from: 'me',
        text: 'Wah trimakasih pak, semoga panenya melimpah 🤑🤑',
        time: '09:44',
        read: true,
      },
    ],
  },
  bpAndi: {
    name: 'Pak Andi',
    avatar: {
      src: '/images/landing/aussie-busukpucuk/wa-andi-av.webp',
      width: 96,
      height: 96,
    },
    messages: [
      {
        from: 'me',
        text: 'Bagaimana hasil penggunaan AUSSIE sejauh ini pak ?',
        time: '10:12',
        read: true,
      },
      {
        from: 'them',
        text: 'Manjur bos, busuk pucuk sudah mulai sembuh, 2 kali aplikasi, pelepah kering dan menguning sudah ga nampak lagi 👌',
        time: '10:14',
      },
      {
        from: 'them',
        photo: {
          src: '/images/landing/aussie-busukpucuk/wa-andi-ph.webp',
          width: 640,
          height: 395,
        },
        time: '10:15',
      },
      {
        from: 'them',
        text: 'Formulanya bekerja cepat, mantab',
        time: '10:16',
      },
      {
        from: 'me',
        text: 'Wah trimakasih pak, semoga panenya melimpah ruah 😍',
        time: '10:16',
        read: true,
      },
    ],
  },
  bpSuroso: {
    name: 'Pak Suroso',
    avatar: {
      src: '/images/landing/aussie-busukpucuk/wa-suroso-av.webp',
      width: 96,
      height: 96,
    },
    messages: [
      {
        from: 'me',
        text: 'Bagaimana hasil penggunaan AUSSIE sejauh ini pak ?',
        time: '09:45',
        read: true,
      },
      {
        from: 'them',
        text: 'Aussie top, manjur dan bekerja dengan cepat, baru 2 kali aplikasi sudah hilang busuk pucuknya, daun kembali hijau dan segar 😍👍👌',
        time: '09:49',
      },
      {
        from: 'them',
        photo: {
          src: '/images/landing/aussie-busukpucuk/wa-suroso-ph.webp',
          width: 640,
          height: 457,
        },
        time: '09:50',
      },
      {
        from: 'them',
        text: 'mantab pokok e',
        time: '09:50',
      },
      {
        from: 'me',
        text: 'Wah trimakasih pak 😍',
        time: '09:51',
        read: true,
      },
    ],
  },
} satisfies Record<string, ChatProps>;
