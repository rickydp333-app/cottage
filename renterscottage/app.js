const state = { events: [], fetchedAt: null, sources: [] };
const CACHE_KEY = 'renters-cottage-cache-v1';
const MANUAL_BOOKINGS_KEY = 'renters-cottage-manual-bookings-v1';

const calendarEl = document.getElementById('calendar');
const monthTitle = document.getElementById('monthTitle');
const connectionStatus = document.getElementById('connectionStatus');
const lastUpdated = document.getElementById('lastUpdated');
const dataNote = document.getElementById('dataNote');
const nextRefresh = document.getElementById('nextRefresh');
const refreshButton = document.getElementById('refreshButton');
const manualBlockButton = document.getElementById('manualBlockButton');
const previousMonthButton = document.getElementById('previousMonthButton');
const nextMonthButton = document.getElementById('nextMonthButton');
const todayButton = document.getElementById('todayButton');
const monthPicker = document.getElementById('monthPicker');

const bookingDialog = document.getElementById('bookingDialog');
const bookingForm = document.getElementById('bookingForm');
const closeBookingButton = document.getElementById('closeBookingButton');
const cancelBookingButton = document.getElementById('cancelBookingButton');
const bookingStart = document.getElementById('bookingStart');
const bookingEnd = document.getElementById('bookingEnd');
const renterName = document.getElementById('renterName');
const renterPhone = document.getElementById('renterPhone');
const renterEmail = document.getElementById('renterEmail');
const bookingNotes = document.getElementById('bookingNotes');
const bookingFormError = document.getElementById('bookingFormError');
const savedBookingsList = document.getElementById('savedBookingsList');

const dateDetailsDialog = document.getElementById('dateDetailsDialog');
const dateDetailsTitle = document.getElementById('dateDetailsTitle');
const dateDetailsBody = document.getElementById('dateDetailsBody');
const closeDateDetailsButton = document.getElementById('closeDateDetailsButton');

const today = new Date();
let viewDate = new Date(today.getFullYear(), today.getMonth(), 1);
let manualBookings = readManualBookings();

updateMonthControls();
scheduleMidnightRefresh();
loadCalendar();

async function loadCalendar() {
  const cached = readCache();
  if (cached) {
    applyCalendar(cached, true);
  }

  try {
    const response = await fetch(`./api.php?refresh=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error('Calendar feed request failed');
    }

    const data = await response.json();
    writeCache(data);
    applyCalendar(data, false);
  } catch {
    if (!cached) {
      connectionStatus.textContent = 'Feeds unavailable';
      connectionStatus.className = 'status-pill is-error';
      renderCalendar([]);
    }
  }
}

function applyCalendar(data, stale) {
  state.fetchedAt = data.fetchedAt;
  state.sources = data.sources || [];
  state.events = state.sources.flatMap((source) => (source.events || []).map((event) => ({ ...event, source: source.source })));
  const failed = state.sources.filter((source) => !source.ok).length;
  connectionStatus.textContent = stale ? 'Saved data · check feed status' : failed ? `${failed} feed unavailable` : 'Feeds up to date';
  connectionStatus.className = `status-pill ${stale || failed ? 'is-warning' : 'is-ok'}`;
  lastUpdated.textContent = `Updated ${formatDateTime(state.fetchedAt)}${stale ? ' · saved' : ''}`;
  dataNote.textContent = failed ? 'Some source data may be stale. Check the feed status before relying on it.' : 'Bookings are shown from the Airbnb and VRBO calendar feeds.';
  renderCalendar(state.events);
}

function renderCalendar(events) {
  calendarEl.innerHTML = '';
  const firstWeekday = viewDate.getDay();
  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();

  ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach((day) => {
    const heading = document.createElement('div');
    heading.className = 'weekday';
    heading.textContent = day;
    calendarEl.appendChild(heading);
  });

  for (let index = 0; index < firstWeekday; index += 1) {
    calendarEl.appendChild(document.createElement('div'));
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const cell = document.createElement('article');
    const date = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    const dateKey = toDateKey(date);
    const nextDateKey = toDateKey(addDays(date, 1));
    const bookings = events.filter((event) => event.start.slice(0, 10) < nextDateKey && event.end.slice(0, 10) > dateKey);
    const sources = [...new Set(bookings.map((booking) => booking.source))];
    const directBookings = manualBookings.filter((booking) => dateKey >= booking.start && dateKey <= booking.end);
    const hasDirectBooking = directBookings.length > 0;
    const hasMixedSources = sources.length && (sources.length > 1 || hasDirectBooking);
    const cellClass = sources.length ? (hasMixedSources ? 'is-mixed' : sources[0].toLowerCase()) : (hasDirectBooking ? 'is-manual' : 'is-available');

    cell.className = `day-cell ${cellClass}`;
    if (date.toDateString() === today.toDateString()) {
      cell.classList.add('is-today');
    }

    cell.classList.add('is-clickable');
    cell.title = 'View booking details';
    cell.addEventListener('click', () => openDateDetails(date, bookings, directBookings));

    cell.innerHTML = `<div class="day-number">${day}</div><div class="day-label">${sources.length || hasDirectBooking ? 'Reserved' : 'Available'}</div>`;

    bookings.forEach((booking) => {
      const detail = document.createElement('div');
      detail.className = 'booking-detail';
      detail.textContent = `${booking.source} · ${booking.summary}`;
      cell.appendChild(detail);
    });

    directBookings.forEach((booking) => {
      const detail = document.createElement('div');
      detail.className = 'booking-detail';
      detail.textContent = `Direct · ${booking.name}`;
      cell.appendChild(detail);
    });

    calendarEl.appendChild(cell);
  }
}

function openBookingDialog() {
  bookingForm.reset();
  bookingFormError.textContent = '';
  const start = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
  bookingStart.value = toDateKey(start);
  bookingEnd.value = toDateKey(start);
  renderSavedBookings();
  bookingDialog.showModal();
}

function closeBookingDialog() {
  bookingDialog.close();
}

function renderSavedBookings() {
  savedBookingsList.innerHTML = '';
  if (!manualBookings.length) {
    savedBookingsList.textContent = 'No direct bookings saved yet.';
    return;
  }

  manualBookings.forEach((booking) => {
    const row = document.createElement('div');
    row.className = 'saved-booking-row';

    const text = document.createElement('span');
    text.textContent = `${booking.name} · ${booking.start} to ${booking.end}`;

    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'remove-booking';
    remove.textContent = 'Remove';
    remove.addEventListener('click', () => {
      manualBookings = manualBookings.filter((item) => item.id !== booking.id);
      writeManualBookings();
      renderSavedBookings();
      renderCalendar(state.events);
    });

    row.append(text, remove);
    savedBookingsList.appendChild(row);
  });
}

function openDateDetails(date, feedBookings, directBookings) {
  dateDetailsTitle.textContent = date.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  dateDetailsBody.innerHTML = '';

  const allBookings = [
    ...feedBookings.map((booking) => ({
      source: booking.source,
      name: booking.summary || 'Reserved',
      start: booking.start,
      end: booking.end,
      details: 'Imported from the calendar feed.'
    })),
    ...directBookings.map((booking) => ({
      source: 'Direct booking',
      name: booking.name,
      start: booking.start,
      end: booking.end,
      details: [booking.phone, booking.email, booking.notes].filter(Boolean).join(' · ') || 'No additional details entered.'
    }))
  ];

  if (!allBookings.length) {
    const empty = document.createElement('p');
    empty.textContent = 'This date is available.';
    dateDetailsBody.appendChild(empty);
  } else {
    allBookings.forEach((booking) => {
      const card = document.createElement('section');
      card.className = `date-booking-card ${booking.source.toLowerCase().replaceAll(' ', '-')}`;

      const source = document.createElement('strong');
      source.textContent = booking.source;

      const name = document.createElement('h3');
      name.textContent = booking.name;

      const dates = document.createElement('p');
      dates.textContent = `${formatDateOnly(booking.start)} to ${formatDateOnly(booking.end)}`;

      const details = document.createElement('p');
      details.textContent = booking.details;

      card.append(source, name, dates, details);
      dateDetailsBody.appendChild(card);
    });
  }

  dateDetailsDialog.showModal();
}

function updateMonthControls() {
  monthTitle.textContent = viewDate.toLocaleDateString([], { month: 'long', year: 'numeric' });
  monthPicker.value = `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, '0')}`;
}

function changeMonth(offset) {
  viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1);
  updateMonthControls();
  renderCalendar(state.events);
}

function scheduleMidnightRefresh() {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  tomorrow.setHours(0, 0, 5, 0);
  nextRefresh.textContent = `Next refresh ${tomorrow.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
  setTimeout(() => window.location.reload(), tomorrow.getTime() - now.getTime());
}

function readCache() {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY));
  } catch {
    return null;
  }
}

function writeCache(data) {
  localStorage.setItem(CACHE_KEY, JSON.stringify(data));
}

function readManualBookings() {
  try {
    const value = JSON.parse(localStorage.getItem(MANUAL_BOOKINGS_KEY));
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function writeManualBookings() {
  localStorage.setItem(MANUAL_BOOKINGS_KEY, JSON.stringify(manualBookings));
}

function formatDateTime(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'unknown time'
    : date.toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function formatDateOnly(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function toDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

refreshButton.addEventListener('click', loadCalendar);
previousMonthButton.addEventListener('click', () => changeMonth(-1));
nextMonthButton.addEventListener('click', () => changeMonth(1));
todayButton.addEventListener('click', () => {
  viewDate = new Date(today.getFullYear(), today.getMonth(), 1);
  updateMonthControls();
  renderCalendar(state.events);
});

monthPicker.addEventListener('change', () => {
  if (!monthPicker.value) {
    return;
  }
  const [year, month] = monthPicker.value.split('-').map(Number);
  viewDate = new Date(year, month - 1, 1);
  updateMonthControls();
  renderCalendar(state.events);
});

manualBlockButton.addEventListener('click', openBookingDialog);
closeBookingButton.addEventListener('click', closeBookingDialog);
cancelBookingButton.addEventListener('click', closeBookingDialog);
closeDateDetailsButton.addEventListener('click', () => dateDetailsDialog.close());

bookingForm.addEventListener('submit', (event) => {
  event.preventDefault();
  bookingFormError.textContent = '';
  if (!bookingStart.value || !bookingEnd.value || bookingEnd.value < bookingStart.value) {
    bookingFormError.textContent = 'Choose an end date on or after the start date.';
    return;
  }

  manualBookings.push({
    id: `direct-${Date.now()}`,
    start: bookingStart.value,
    end: bookingEnd.value,
    name: renterName.value.trim(),
    phone: renterPhone.value.trim(),
    email: renterEmail.value.trim(),
    notes: bookingNotes.value.trim()
  });

  writeManualBookings();
  renderCalendar(state.events);
  closeBookingDialog();
});