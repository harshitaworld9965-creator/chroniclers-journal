export const MOODS = [
  { id: 'sunny', emoji: '☀️', label: 'Sunny', color: '#d9a441' },
  { id: 'bright', emoji: '🌤️', label: 'Bright', color: '#c98a5a' },
  { id: 'cloudy', emoji: '☁️', label: 'Cloudy', color: '#9c8f82' },
  { id: 'rainy', emoji: '🌧️', label: 'Rainy', color: '#6c7c92' },
  { id: 'stormy', emoji: '⛈️', label: 'Stormy', color: '#4b3f5c' },
  { id: 'rainbow', emoji: '🌈', label: 'Rainbow', color: '#8f3a46' },
]

export const moodById = Object.fromEntries(MOODS.map((m) => [m.id, m]))