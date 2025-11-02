import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import mapboxgl from 'mapbox-gl';

//DTOs existentes
export interface LocationDTO {
    latitude: number;
    longitude: number;
    address?: string;
}

export interface MarkerDTO {
    id: number;
    location: LocationDTO;
    title: string;
    photoUrl: string;
}

@Injectable({
    providedIn: 'root'
})
export class MapService {
    private map!: mapboxgl.Map;
    private markers: mapboxgl.Marker[] = [];
    private readonly accessToken = 'pk.eyJ1IjoiaGVsZW5naXJhbGRvIiwiYSI6ImNtaGd6MGt6czBha2YycnBuajY0ZW9pMGYifQ.d4wxE2yNQvqgflsUK7YZxQ';

    constructor() {
        // Asignar el token globalmente
        (mapboxgl as any).accessToken = this.accessToken;
    }

    /** Inicializa el mapa en el contenedor */
    initializeMap(containerId: string, center: [number, number], zoom: number): void {
        try {
            this.map = new mapboxgl.Map({
                container: containerId,
                style: 'mapbox://styles/mapbox/streets-v12',
                center: center,
                zoom: zoom
            });

            // Agregar controles de navegación
            this.map.addControl(new mapboxgl.NavigationControl(), 'top-right');

            // Evento cuando el mapa termina de cargar
            this.map.on('load', () => {
                console.log('✅ Mapa cargado correctamente');
            });

            // Evento de error
            this.map.on('error', (e) => {
                console.error('❌ Error en el mapa:', e);
            });

        } catch (error) {
            console.error('❌ Error al inicializar el mapa:', error);
        }
    }

    /** Agrega un marcador de un alojamiento existente */
    addMarker(markerData: MarkerDTO): void {
        if (!this.map) {
            console.error('❌ Mapa no inicializado');
            return;
        }

        // Crear elemento personalizado para el marcador
        const el = document.createElement('div');
        el.className = 'custom-marker';
        el.style.backgroundImage = `url(${markerData.photoUrl})`;
        el.style.width = '50px';
        el.style.height = '50px';
        el.style.borderRadius = '50%';
        el.style.backgroundSize = 'cover';
        el.style.backgroundPosition = 'center';
        el.style.border = '3px solid white';
        el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
        el.style.cursor = 'pointer';

        const marker = new mapboxgl.Marker(el)
            .setLngLat([markerData.location.longitude, markerData.location.latitude])
            .setPopup(
                new mapboxgl.Popup({ offset: 25 })
                    .setHTML(`
                        <div style="padding: 5px;">
                            <h4 style="margin: 0 0 5px 0; color: #333; font-size: 14px;">${markerData.title}</h4>
                            ${markerData.location.address ? `<p style="margin: 0; color: #666; font-size: 12px;">${markerData.location.address}</p>` : ''}
                        </div>
                    `)
            )
            .addTo(this.map);

        this.markers.push(marker);
    }

    /** Permite agregar marcador haciendo clic y devuelve coordenadas */
    addMarkerOnClick(): Observable<mapboxgl.LngLat> {
        return new Observable((observer) => {
            if (!this.map) {
                observer.error('Mapa no inicializado');
                return;
            }

            console.log('🗺️ Listo para recibir clics en el mapa');

            const onClick = (e: mapboxgl.MapMouseEvent) => {
                console.log('🖱️ Clic detectado en:', e.lngLat);

                // Limpiar marcadores anteriores
                this.clearMarkers();

                // Crear marcador rojo visible con el pin por defecto de Mapbox
                const marker = new mapboxgl.Marker({
                    color: '#FF0000',
                    draggable: false,
                    scale: 1.2 // Hacerlo un poco más grande
                })
                    .setLngLat(e.lngLat)
                    .addTo(this.map);

                this.markers.push(marker);

                console.log('📍 Marcador agregado en:', e.lngLat);

                // Emitir las coordenadas
                observer.next(e.lngLat);
            };

            // Agregar el evento de clic
            this.map.on('click', onClick);

            // Limpieza al desuscribirse
            return () => {
                console.log('🧹 Limpiando listener de clics');
                this.map.off('click', onClick);
            };
        });
    }

    /** Limpia los marcadores existentes */
    clearMarkers(): void {
        console.log(`🧹 Limpiando ${this.markers.length} marcador(es)`);
        this.markers.forEach((m) => m.remove());
        this.markers = [];
    }

    /** Obtiene la instancia del mapa */
    getMap(): mapboxgl.Map {
        return this.map;
    }

    /** Verifica si el mapa está inicializado */
    isMapInitialized(): boolean {
        return !!this.map;
    }

    /** Centra el mapa en unas coordenadas específicas */
    centerMap(lng: number, lat: number, zoom?: number): void {
        if (this.map) {
            this.map.flyTo({
                center: [lng, lat],
                zoom: zoom || this.map.getZoom(),
                essential: true
            });
        }
    }

    /** Destruye el mapa y limpia recursos */
    destroyMap(): void {
        console.log('🗑️ Destruyendo mapa');
        this.clearMarkers();
        if (this.map) {
            this.map.remove();
        }
    }
}