'use strict';

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class Workout {
  date = new Date();
  id = Date.now();

  constructor(distance, duration, coords) {
    this.distance = distance;
    this.duration = duration;
    this.coords = coords;
  }

  setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    this.description = `${this.type[0].toUpperCase() + this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
}

class Running extends Workout {
  type = 'running';
  constructor(distance, duration, coords, cadence) {
    super(distance, duration, coords);
    this.cadence = cadence;
    this.#calcPace();
    this.setDescription();
  }

  #calcPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  type = 'cycling';
  constructor(distance, duration, coords, elevationGain) {
    super(distance, duration, coords);
    this.elevationGain = elevationGain;
    this.#calcSpeed();
    this.setDescription();
  }

  #calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

class App {
  #map;
  #coords;
  #workout;
  #mapEvent;
  #workoutsList = [];

  constructor() {
    this.#getPosition();
    form.addEventListener('submit', this.#newWorkout.bind(this));
    containerWorkouts.addEventListener('click', this.#moveMarker.bind(this));
    this.#getLocalData();
  }

  #getPosition() {
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this.#loadMap.bind(this),
        function () {
          alert('Something went wrong!');
        }
      );
  }

  #loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;

    this.#coords = [latitude, longitude];

    this.#map = L.map('map').setView(this.#coords, 13);

    L.tileLayer(
      'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png',
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }
    ).addTo(this.#map);

    this.#map.on('click', this.#showForm.bind(this));

    this.#workoutsList.forEach(work => this.#renderMarker(work));
  }

  #showForm(mapE) {
    this.#mapEvent = mapE;
    // e.preventDefault();
    //prettier-ignore
    inputDistance.value = inputDuration.value = inputCadence.value = inputElevation.value = '';
    form.classList.remove('hidden');
    inputDistance.focus();

    inputType.addEventListener('change', this.#toggleElevationField.bind(this));
  }

  #hideForm() {
    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => {
      form.style.display = 'grid';
    }, 1000);
  }

  #toggleElevationField() {
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
  }

  #newWorkout(e) {
    //! Check if positive number
    const validInputs = (...inputs) =>
      inputs.every(inp => Number.isFinite(inp));

    const positiveNumber = (...inputs) => inputs.every(inp => inp > 0);

    e.preventDefault();

    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const type = inputType.value;
    const { lat, lng } = this.#mapEvent.latlng;

    //! Start validating form
    if (type === 'running') {
      const cadence = +inputCadence.value;
      if (
        !validInputs(distance, duration, cadence) ||
        !positiveNumber(distance, duration, cadence)
      )
        return alert('Please enter valid and positive number!');

      this.#workout = new Running(distance, duration, [lat, lng], cadence);
    }

    if (type === 'cycling') {
      const elavation = +inputElevation.value;

      if (
        !validInputs(distance, duration, elavation) ||
        !positiveNumber(distance, duration)
      )
        return alert('Please enter valid and positive number!');

      this.#workout = new Cycling(distance, duration, [lat, lng], elavation);
    }
    this.#workoutsList.push(this.#workout);
    this.#init();
  }

  #init() {
    this.#renderWorkout(this.#workout);
    this.#hideForm();
    this.#renderMarker(this.#workout);

    this.#setLocalData();
  }

  #renderWorkout(work) {
    console.log(work);
    const type = work.type;

    let html = `<li class="workout workout--${type}" data-id="${work.id}">
    <h2 class="workout__title">${work.description}</h2>
    <div class="workout__details">
      <span class="workout__icon">${type === 'running' ? '🏃‍♂️' : '🚴‍♀️'}</span>
      <span class="workout__value">${work.distance}</span>
      <span class="workout__unit">km</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⏱</span>
      <span class="workout__value">${work.duration}</span>
      <span class="workout__unit">min</span>
    </div>`;

    if (type === 'running') {
      html += `
      <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${work.pace.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${work.cadence}</span>
            <span class="workout__unit">spm</span>
          </div>
        </li>
      `;
    }

    if (type === 'cycling') {
      html += `
      <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${work.speed.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${work.elevationGain}</span>
            <span class="workout__unit">spm</span>
          </div>
        </li>
      `;
    }
    form.insertAdjacentHTML('afterend', html);
  }

  #renderMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`
      )
      .openPopup();
  }

  #moveMarker(event) {
    if (!this.#map) return;

    const workoutEl = event.target.closest('.workout');
    if (!workoutEl) return;

    const findWorkout = this.#workoutsList.find(
      el => el.id === +workoutEl.dataset.id
    );
    this.#map.setView(findWorkout.coords, 13, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
  }

  #setLocalData() {
    localStorage.setItem('workouts', JSON.stringify(this.#workoutsList));
  }

  #getLocalData() {
    const data = JSON.parse(localStorage.getItem('workouts'));

    if (!data) return;
    console.log(data);

    this.#workoutsList = data;

    this.#workoutsList.forEach(work => this.#renderWorkout(work));
  }

  reset() {
    localStorage.removeItem('workouts');
    location.reload();
  }

  #deleteWorkout() {}
}

const app = new App();
