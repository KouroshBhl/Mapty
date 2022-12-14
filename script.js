'use strict';

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
const btnDeleteAll = document.querySelector('.delete__all');
const btnDeleteAllApprove = document.querySelector('.delete_all--workouts');
const deleteAllContainer = document.querySelector('.btn__deleteAll--container');
const deleteAllCancel = document.querySelector('.deleteAll_cancel');

const editIcon = document.querySelector('.btn__delete');

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
    btnDeleteAll.addEventListener('click', this.#deleteAll.bind(this));
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
    const type = work.type;

    let html = `
    <div class="get__approval">
    <div class="feauture__workouts--container">
    <li class="workout workout--${type}" data-id="${work.id}">
   
    <h2 class="workout__title">${work.description}</h2>
    
    <div class="workout__details">
      <span class="workout__icon">${type === 'running' ? '?????????????' : '?????????????'}</span>
      <span class="workout__value">${work.distance}</span>
      <span class="workout__unit">km</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">???</span>
      <span class="workout__value">${work.duration}</span>
      <span class="workout__unit">min</span>
    </div>`;

    if (type === 'running') {
      html += `
      <div class="workout__details">
            <span class="workout__icon">??????</span>
            <span class="workout__value">${work.pace.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">????????</span>
            <span class="workout__value">${work.cadence}</span>
            <span class="workout__unit">spm</span>
          </div>
        </li>
        
      `;
    }

    if (type === 'cycling') {
      html += `
      <div class="workout__details">
            <span class="workout__icon">??????</span>
            <span class="workout__value">${work.speed.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">????????</span>
            <span class="workout__value">${work.elevationGain}</span>
            <span class="workout__unit">spm</span>
          </div>
        </li>
      `;
    }

    html += `
    <div class="feauture__icons" data-id="${work.id}">
    <div class="hero__icons hero__edit">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5">
  <path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" />
  <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" />
</svg>

    </div>
    <div class="hero__icons hero__trash">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5">
  <path fill-rule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clip-rule="evenodd" />
</svg>


    </div>
  </div>
  </div>
  <div class="delete__workout hidden">
<p class="delete__message"> Are you sure you want to delete? </p>
<button class="btn btn__cancel">Cancel</button>
<button class="btn btn__delete">Delete!</button>
</div>
  </div>
    `;

    form.insertAdjacentHTML('afterend', html);
    const trashIcon = document.querySelector('.hero__trash');

    trashIcon.addEventListener('click', this.#deleteWorkout.bind(this));
    editIcon.addEventListener('click', this.#editWorkout.bind(this));

    if (this.#workoutsList.length > 1) {
      btnDeleteAll.classList.remove('hidden');
    }
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
        `${workout.type === 'running' ? '?????????????' : '?????????????'} ${workout.description}`
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

    this.#workoutsList = data;

    this.#workoutsList.forEach(work => this.#renderWorkout(work));
  }

  reset() {
    localStorage.removeItem('workouts');
    location.reload();
  }

  #deleteWorkout(e) {
    const deleteEl = e.target.closest('.feauture__icons');
    const deleteLi = e.target.closest('.feauture__workouts--container');
    const showApproval = deleteLi.nextElementSibling;
    const findEl = this.#workoutsList.find(
      work => work.id === +deleteEl.dataset.id
    );

    showApproval.classList.remove('hidden');
    deleteEl.classList.add('hidden');
    deleteLi.classList.add('hidden');

    const btnDelete = showApproval.children.item(2);
    const btnCancel = showApproval.children.item(1);

    const removeApproved = function () {
      this.#workoutsList.pop(findEl);
      this.#setLocalData();
      location.reload();
    };

    btnDelete.addEventListener('click', removeApproved.bind(this));

    btnCancel.addEventListener('click', function () {
      showApproval.classList.add('hidden');
      deleteEl.classList.remove('hidden');
      deleteLi.classList.remove('hidden');
    });
  }

  #editWorkout() {
    this.#showForm(bind(this));
  }

  #deleteAll() {
    deleteAllContainer.classList.remove('hidden');
    btnDeleteAll.classList.add('hidden');

    const remove = () => this.reset();

    btnDeleteAllApprove.addEventListener('click', remove.bind(this));

    deleteAllCancel.addEventListener('click', function () {
      deleteAllContainer.classList.add('hidden');
      btnDeleteAll.classList.remove('hidden');
    });
  }
}

const app = new App();
