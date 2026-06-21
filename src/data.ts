import { Report } from './types';

export const REPORTS: Report[] = [
  {
    id: 'RPT-001',
    citizenName: 'Warga Anonim 1',
    aiCategory: 'Infrastruktur',
    aiPriorityScore: 95,
    status: 'Ditinjau',
    date: '10 Jun 2026',
    originalComplaint: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
    preview: 'Lorem Ipsum',
    messages: [
      {
        id: 'm1',
        sender: 'citizen',
        text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
        timestamp: '10:30'
      },
      {
        id: 'm2',
        sender: 'admin',
        text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
        timestamp: '10:35'
      }
    ]
  },
  {
    id: 'RPT-002',
    citizenName: 'Bapak Budi',
    aiCategory: 'Keamanan',
    aiPriorityScore: 80,
    status: 'Menunggu',
    date: '09 Jun 2026',
    originalComplaint: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
    preview: 'Lorem Ipsum',
    messages: [
      {
        id: 'm3',
        sender: 'citizen',
        text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
        timestamp: 'Kemarin'
      }
    ]
  },
  {
    id: 'RPT-003',
    citizenName: 'Ibu Siti',
    aiCategory: 'Kebersihan',
    aiPriorityScore: 40,
    status: 'Menunggu',
    date: '08 Jun 2026',
    originalComplaint: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
    preview: 'Lorem Ipsum',
    messages: [
      {
        id: 'm4',
        sender: 'citizen',
        text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
        timestamp: 'Senin'
      }
    ]
  }
];
