import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { RegionsList } from './regions-list';
import { SubregionsList } from '../subregions/subregions-list';
import { DifficultiesList } from '../difficulties/difficulties-list';

describe('reference-data edit flow', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideNoopAnimations()],
    });
    http = TestBed.inject(HttpTestingController);
  });

  it('regions: edit button prefills form and submits PATCH', async () => {
    const fixture = TestBed.createComponent(RegionsList);
    fixture.detectChanges();
    http
      .expectOne('http://localhost:3000/regions')
      .flush([{ id: 'r1', code: 'WEL', name: 'Wellington', regionImageUrl: null }]);
    await fixture.whenStable();

    const el = fixture.nativeElement as HTMLElement;
    const buttons = Array.from(el.querySelectorAll('mat-list-item button'));
    expect(buttons.length).toBe(1);
    expect(buttons[0].textContent?.trim()).toBe('Edit');
    expect(el.textContent).not.toContain('Delete');
    expect(el.querySelector('button[type=submit]')?.textContent?.trim()).toBe('Add Region');

    (buttons[0] as HTMLButtonElement).click();
    await fixture.whenStable();

    const cmp = fixture.componentInstance;
    expect(cmp.editingId()).toBe('r1');
    expect(cmp.form.getRawValue()).toEqual({ code: 'WEL', name: 'Wellington', regionImageUrl: '' });
    expect(el.querySelector('button[type=submit]')?.textContent?.trim()).toBe('Save changes');
    expect(el.querySelector('mat-list-item.is-editing')).toBeTruthy();
    expect(el.querySelector('.form-card.is-editing')).toBeTruthy();

    cmp.form.patchValue({ name: 'Wellington Region' });
    (el.querySelector('button[type=submit]') as HTMLButtonElement).click();
    const patch = http.expectOne('http://localhost:3000/regions/r1');
    expect(patch.request.method).toBe('PATCH');
    expect(patch.request.body).toEqual({
      code: 'WEL',
      name: 'Wellington Region',
      regionImageUrl: undefined,
    });
    patch.flush({ id: 'r1', code: 'WEL', name: 'Wellington Region', regionImageUrl: null });

    expect(cmp.editingId()).toBeNull();
    http.expectOne('http://localhost:3000/regions').flush([]);
  });

  it('regions: shows a distinct banner when the update fails', async () => {
    const fixture = TestBed.createComponent(RegionsList);
    fixture.detectChanges();
    http
      .expectOne('http://localhost:3000/regions')
      .flush([{ id: 'r1', code: 'WEL', name: 'Wellington', regionImageUrl: null }]);
    await fixture.whenStable();

    const cmp = fixture.componentInstance;
    cmp.startEdit({ id: 'r1', code: 'WEL', name: 'Wellington', regionImageUrl: null });
    cmp.submit();
    http
      .expectOne('http://localhost:3000/regions/r1')
      .flush({}, { status: 404, statusText: 'Not Found' });
    await fixture.whenStable();

    expect(cmp.error()).toBe('Failed to update region.');
    const banner = (fixture.nativeElement as HTMLElement).querySelector('.error-banner');
    expect(banner?.textContent?.trim()).toBe('Failed to update region.');
  });

  it('subregions: edit submits PATCH with numeric id', async () => {
    const fixture = TestBed.createComponent(SubregionsList);
    fixture.detectChanges();
    http
      .expectOne('http://localhost:3000/regions')
      .flush([{ id: 'r1', code: 'WEL', name: 'Wellington', regionImageUrl: null }]);
    http
      .expectOne((r) => r.url === 'http://localhost:3000/subregions')
      .flush([{ id: 7, subRegionName: 'Kapiti', regionId: 'r1' }]);
    await fixture.whenStable();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).not.toContain('Delete');
    const edit = el.querySelector('mat-list-item button') as HTMLButtonElement;
    expect(edit.textContent?.trim()).toBe('Edit');
    edit.click();
    await fixture.whenStable();

    const cmp = fixture.componentInstance;
    expect(cmp.editingId()).toBe(7);
    expect(cmp.form.getRawValue()).toEqual({ subRegionName: 'Kapiti', regionId: 'r1' });

    cmp.form.patchValue({ subRegionName: 'Kapiti Coast' });
    cmp.submit();
    const patch = http.expectOne('http://localhost:3000/subregions/7');
    expect(patch.request.method).toBe('PATCH');
    expect(patch.request.body).toEqual({ subRegionName: 'Kapiti Coast', regionId: 'r1' });
    patch.flush({ id: 7, subRegionName: 'Kapiti Coast', regionId: 'r1' });
    expect(cmp.editingId()).toBeNull();
    http.expectOne((r) => r.url === 'http://localhost:3000/subregions').flush([]);
  });

  it('difficulties: edit submits PATCH and cancel restores create mode', async () => {
    const fixture = TestBed.createComponent(DifficultiesList);
    fixture.detectChanges();
    http.expectOne('http://localhost:3000/difficulties').flush([{ id: 'd1', name: 'Medium' }]);
    await fixture.whenStable();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).not.toContain('Delete');
    expect(el.querySelector('.difficulty-badge--medium')).toBeTruthy();

    (el.querySelector('mat-list-item button') as HTMLButtonElement).click();
    await fixture.whenStable();

    const cmp = fixture.componentInstance;
    expect(cmp.editingId()).toBe('d1');
    expect(el.querySelector('button[type=submit]')?.textContent?.trim()).toBe('Save changes');

    const cancel = Array.from(el.querySelectorAll('.form-actions button')).find(
      (b) => b.textContent?.trim() === 'Cancel',
    ) as HTMLButtonElement;
    expect(cancel).toBeTruthy();
    cancel.click();
    await fixture.whenStable();
    expect(cmp.editingId()).toBeNull();
    expect(el.querySelector('button[type=submit]')?.textContent?.trim()).toBe('Add Difficulty');

    cmp.form.patchValue({ name: 'Hard' });
    cmp.submit();
    const post = http.expectOne('http://localhost:3000/difficulties');
    expect(post.request.method).toBe('POST');
    post.flush({ id: 'd2', name: 'Hard' });
    http.expectOne('http://localhost:3000/difficulties').flush([]);
  });

  afterEach(() => http.verify());
});
