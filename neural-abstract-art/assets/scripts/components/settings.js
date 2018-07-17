import ImageSettingsModel from '../models/image-settings.js';
import RenderSettingsModel from '../models/render-settings.js';
import RenderSettingsRepository from '../repositories/render-settings.js';
import debounce from '../utils/debounce.js';

import BaseComponent from './base.js';

const batchSizes = [
	128,
	512,
	1024,
	2048,
];

export default class SettingsComponent extends BaseComponent {
	constructor(element) {
		super(element);

		// Image settings
		this._inputHeight = this.element.elements.height;
		this._inputHeight.min = 1;
		this._inputRenderSpeed = this.element.elements['render-speed'];
		this._inputWidth = this.element.elements.width;
		this._inputWidth.min = 1;

		// Render settings
		this._inputSeed = this.element.elements.seed;
		this._inputSeed.max = RenderSettingsModel.SEED_MAX;
		this._inputSeed.min = RenderSettingsModel.SEED_MIN;
		this._inputSeed.step = 1;
		this._inputTime = this.element.elements.time;
		this._inputTime.step = 1 / Math.pow(10, RenderSettingsModel.TIME_PRECISION);
		this._inputVariance = this.element.elements.variance;
		this._inputVariance.max = RenderSettingsModel.VARIANCE_MAX;
		this._inputVariance.min = RenderSettingsModel.VARIANCE_MIN;
		this._buttonRandomize = this.element.elements.randomize;

		this._imageSettings = new ImageSettingsModel();
		this._renderSettings = new RenderSettingsModel();

		this._updateFields();

		const handleInputUpdate = debounce(this._handleInputUpdate.bind(this));

		this.element.addEventListener('input', (e) => {
			if (
				e.target !== this._inputSeed &&
				e.target !== this._inputTime &&
				e.target !== this._inputVariance
			) return;

			handleInputUpdate();
		});

		this.element.addEventListener('change', (e) => {
			if (
				e.target.name !== 'height' &&
				e.target.name !== 'width'
			) return;

			handleInputUpdate();
		});

		this.element.addEventListener('click', (e) => {
			if (e.target.name !== 'resolution-preset') return;

			this._imageSettings.setResolutionFromString(e.target.dataset.resolution);
			this.trigger('change');
		});

		this._buttonRandomize.addEventListener('click', () => this._randomize());
	}

	get aspect() {
		return this.width / this.height;
	}

	get batchSize() {
		if (!batchSizes[this._imageSettings.renderSpeed]) {
			return batchSizes[0];
		}

		return batchSizes[this._imageSettings.renderSpeed];
	}

	get height() {
		return this._imageSettings.height;
	}

	get pixelCount() {
		return this.height * this.width;
	}

	get seed() {
		return this._renderSettings.seed;
	}

	get time() {
		return this._renderSettings.time;
	}

	get variance() {
		return this._renderSettings.variance;
	}

	get width() {
		return this._imageSettings.width;
	}

	update() {
		const renderSettings = RenderSettingsRepository.getRenderSettings();

		if (renderSettings) {
			this._renderSettings = RenderSettingsRepository.getRenderSettings();
		}

		this._updateFields();
	}

	persist() {
		RenderSettingsRepository.persist(this._renderSettings);
	}

	_handleInputUpdate() {
		if (!this.element.reportValidity()) return;

		this._hydrate();
		this.persist();
		this.trigger('change');
	}

	_hydrate() {
		this._renderSettings.seed = Number.parseInt(this._inputSeed.value);
		this._renderSettings.time = Number.parseFloat(this._inputTime.value);
		this._renderSettings.variance = Number.parseInt(this._inputVariance.value);

		this._imageSettings.height = Number.parseInt(this._inputHeight.value);
		this._imageSettings.renderSpeed = Number.parseInt(this._inputRenderSpeed.value);
		this._imageSettings.width = Number.parseInt(this._inputWidth.value);
	}

	_randomize() {
		this._renderSettings.randomize();
		this.persist();

		this.trigger('change');
	}

	_updateFields() {
		this._inputSeed.value = this._renderSettings.seed;
		this._inputTime.value = this._renderSettings.time;
		this._inputVariance.value = this._renderSettings.variance;

		this._inputHeight.value = this._imageSettings.height;
		this._inputRenderSpeed.value = this._imageSettings.renderSpeed;
		this._inputWidth.value = this._imageSettings.width;
	}
}
