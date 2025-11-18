import io
from datetime import datetime

from rest_framework import generics, status, serializers
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db import connection
from django.http import HttpResponse
from django.utils.text import slugify
from .models import Proyecto, PanelLayoutPreference, Reporte, ReporteSnapshot
from .serializers import ProyectoSerializer, PanelLayoutPreferenceSerializer, ReportExportSerializer, ReporteSerializer, ReporteCreateSerializer
from apps.notifications.utils import create_notification_if_enabled
from .layouts import DEFAULT_LAYOUT_CODE, safe_default_panel_state
from datetime import timedelta


class ProyectoListCreateView(generics.ListCreateAPIView):
    queryset = Proyecto.objects.all()
    serializer_class = ProyectoSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        with connection.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO dbo.proyectos (nombre, descripcion, fecha_inicio, fecha_fin, id_pm)
                OUTPUT INSERTED.id_proyecto
                VALUES (%s, %s, %s, %s, %s)
                """,
                [
                    data.get('nombre'),
                    data.get('descripcion'),
                    data.get('fecha_inicio'),
                    data.get('fecha_fin'),
                    data.get('id_pm'),
                ]
            )
            new_id = cursor.fetchone()[0]
        instance = Proyecto.objects.get(id_proyecto=new_id)
        output = self.get_serializer(instance).data

        try:
            if output.get('id_pm'):
                create_notification_if_enabled(
                    id_usuario=output['id_pm'],
                    tipo='proyecto_creado',
                    titulo=f"Proyecto creado: {output.get('nombre')}",
                    mensaje=output.get('descripcion'),
                    link=f"/dashboard/proyectos"
                )
        except Exception:
            pass

        headers = self.get_success_headers(output)
        return Response(output, status=status.HTTP_201_CREATED, headers=headers)


class ProyectoRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Proyecto.objects.all()
    serializer_class = ProyectoSerializer
    lookup_field = 'id_proyecto'

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        with connection.cursor() as cursor:
            cursor.execute(
                """
                UPDATE dbo.proyectos
                SET nombre = %s, descripcion = %s, fecha_inicio = %s, fecha_fin = %s, id_pm = %s
                WHERE id_proyecto = %s
                """,
                [
                    data.get('nombre'),
                    data.get('descripcion'),
                    data.get('fecha_inicio'),
                    data.get('fecha_fin'),
                    data.get('id_pm'),
                    instance.id_proyecto,
                ]
            )
        instance = Proyecto.objects.get(id_proyecto=instance.id_proyecto)
        return Response(self.get_serializer(instance).data)


class PanelLayoutPreferenceView(APIView):
    """
    UC-04: Configurar disposición de paneles del dashboard principal.
    Soporta lectura, guardado y restablecimiento del layout por usuario/proyecto.
    """

    def _parse_scope(self, request):
        raw_user = request.query_params.get('id_usuario')
        if raw_user in (None, ''):
            raise serializers.ValidationError('id_usuario es requerido')
        try:
            user_id = int(raw_user)
        except (TypeError, ValueError):
            raise serializers.ValidationError('id_usuario debe ser entero')
        if user_id <= 0:
            raise serializers.ValidationError('id_usuario debe ser positivo')

        raw_project = request.query_params.get('id_proyecto', 0)
        if raw_project in (None, ''):
            project_id = 0
        else:
            try:
                project_id = int(raw_project)
            except (TypeError, ValueError):
                raise serializers.ValidationError('id_proyecto debe ser entero')
            if project_id < 0:
                raise serializers.ValidationError('id_proyecto debe ser positivo')

        return user_id, project_id

    def get(self, request):
        user_id, project_id = self._parse_scope(request)

        pref = PanelLayoutPreference.objects.filter(id_usuario=user_id, id_proyecto=project_id).first()
        if pref:
            data = PanelLayoutPreferenceSerializer(pref).data
        else:
            data = {
                'id': None,
                'id_usuario': user_id,
                'id_proyecto': project_id,
                'layout_code': DEFAULT_LAYOUT_CODE,
                'panel_state': safe_default_panel_state(),
                'pinned_panels': [],
                'updated_at': None,
            }
        return Response(data)

    def post(self, request):
        serializer = PanelLayoutPreferenceSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payload = serializer.validated_data

        pref, created = PanelLayoutPreference.objects.update_or_create(
            id_usuario=payload['id_usuario'],
            id_proyecto=payload.get('id_proyecto', 0),
            defaults={
                'layout_code': payload['layout_code'],
                'panel_state': payload['panel_state'],
                'pinned_panels': payload.get('pinned_panels', []),
            }
        )
        return Response(
            PanelLayoutPreferenceSerializer(pref).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK
        )

    def delete(self, request):
        user_id, project_id = self._parse_scope(request)
        PanelLayoutPreference.objects.filter(id_usuario=user_id, id_proyecto=project_id).delete()

        data = {
            'id': None,
            'id_usuario': user_id,
            'id_proyecto': project_id,
            'layout_code': DEFAULT_LAYOUT_CODE,
            'panel_state': safe_default_panel_state(),
            'pinned_panels': [],
            'updated_at': None,
        }
        return Response(data, status=status.HTTP_200_OK)


# ===================================================================
# =======================  MODIFICADO COMPLETAMENTE  =================
# ===================================================================

class ReportExportPDFView(APIView):
    """
    UC-12: Exportar reportes a PDF, con configuración dinámica:
    - Ocultar/mostrar secciones
    - Tamaño de letra
    - Pie de página
    """

    def post(self, request):
        serializer = ReportExportSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        # ==== NUEVO BLOQUE DE FORMATO ====
        formato = data.get("formato", {})

        mostrar_filtros = formato.get("mostrarFiltros", True)
        mostrar_resumen = formato.get("mostrarResumen", True)
        mostrar_items = formato.get("mostrarItems", True)
        mostrar_secciones = formato.get("mostrarSecciones", True)
        tamano_fuente = formato.get("tamanoFuente", 14)
        pie_pagina = formato.get("piePagina", "")
        # =================================

        title = data['titulo']
        generated_at = datetime.now().strftime('%Y-%m-%d %H:%M')
        lines = [title, f'Generado: {generated_at}', '']

        # ===== FILTROS =====
        filtros = data.get('filtros') or {}
        if mostrar_filtros and filtros:
            lines.append('Filtros aplicados:')
            for key, value in filtros.items():
                lines.append(f'  - {key}: {value}')
            lines.append('')

        # ===== RESUMEN =====
        resumen = data.get('resumen') or {}
        if mostrar_resumen and resumen:
            lines.append('Resumen ejecutivo:')
            for key, value in resumen.items():
                lines.append(f'  - {key}: {value}')
            lines.append('')

        # ===== ITEMS =====
        items = data.get('items') or []
        if mostrar_items and items:
            lines.append('Principales iniciativas:')
            for item in items[:5]:
                name = item.get('initiative') or item.get('iniciativa') or 'Elemento'
                status = item.get('status') or item.get('estado') or ''
                progress = item.get('progress') or item.get('progreso') or ''
                owner = item.get('owner') or item.get('responsable') or ''
                lines.append(
                    f'  • {name} ({status}) - {progress} {(" / " + owner) if owner else ""}'.rstrip()
                )
            lines.append('')

        # ===== SECCIONES =====
        secciones = data.get('secciones') or []
        if mostrar_secciones and secciones:
            lines.append('Secciones incluidas:')
            for section in secciones:
                nombre = section.get('label') or section.get('titulo') or section.get('key') or ''
                descripcion = section.get('description') or section.get('descripcion') or ''
                lines.append(f'  - {nombre}')
                if descripcion:
                    for wrapped in self._wrap_text(descripcion, width=90, indent='      '):
                        lines.append(wrapped)
            lines.append('')

        # ===== NOTA =====
        nota = data.get('nota')
        if nota:
            lines.append('Notas:')
            for wrapped in self._wrap_text(nota, width=95, indent='  '):
                lines.append(wrapped)

        # ===== GENERAR PDF =====
        pdf_bytes = self._build_simple_pdf(lines, tamano_fuente, pie_pagina)

        filename = data.get('nombre_archivo') or slugify(title) or 'reporte'
        response = HttpResponse(pdf_bytes, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename={filename}.pdf'
        return response

    # =========================
    # Utilidad wrapping
    # =========================
    def _wrap_text(self, text, width=80, indent=''):
        words = text.split()
        if not words:
            return []
        lines = []
        current = []
        current_len = 0
        for word in words:
            additional = len(word) + (1 if current else 0)
            if current_len + additional > width:
                lines.append(indent + ' '.join(current))
                current = [word]
                current_len = len(word)
            else:
                current.append(word)
                current_len += additional
        if current:
            lines.append(indent + ' '.join(current))
        return lines

    def _escape_pdf_text(self, text):
        return text.replace('\\', '\\\\').replace('(', '\\(').replace(')', '\\)')

    # =========================
    # GENERADOR DEL PDF
    # =========================
    def _build_simple_pdf(self, lines, tamano_fuente, pie_pagina):
        formatted = []
        for line in lines:
            if len(line) > 100:
                formatted.extend(self._wrap_text(line))
            else:
                formatted.append(line)

        if not formatted:
            formatted = ['Reporte']

        buffer = io.BytesIO()
        buffer.write(b'%PDF-1.4\n')
        offsets = [0] * 6

        def write_obj(num, body_bytes):
            offsets[num] = buffer.tell()
            buffer.write(f'{num} 0 obj\n'.encode('ascii'))
            buffer.write(body_bytes)
            buffer.write(b'\nendobj\n')

        write_obj(1, b'<< /Type /Catalog /Pages 2 0 R >>')
        write_obj(2, b'<< /Type /Pages /Count 1 /Kids [3 0 R] >>')
        write_obj(
            3,
            b'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>'
        )

        # TEXTO DEL PDF
        stream_lines = [
            'BT',
            f'/F1 {tamano_fuente} Tf',
            '64 740 Td'
        ]

        for idx, line in enumerate(formatted):
            escaped = self._escape_pdf_text(line)
            if idx == 0:
                stream_lines.append(f'({escaped}) Tj')
            else:
                stream_lines.append('0 -18 Td')
                stream_lines.append(f'({escaped}) Tj')

        # PIE DE PÁGINA
        if pie_pagina:
            stream_lines.append('0 -40 Td')
            stream_lines.append(f'({self._escape_pdf_text(pie_pagina)}) Tj')

        stream_lines.append('ET')

        stream = '\n'.join(stream_lines).encode('latin-1', 'ignore')
        content = f'<< /Length {len(stream)} >>\nstream\n'.encode('ascii') + stream + b'\nendstream'

        write_obj(4, content)
        write_obj(5, b'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>')

        xref_pos = buffer.tell()
        buffer.write(b'xref\n0 6\n')
        buffer.write(b'0000000000 65535 f \n')
        for idx in range(1, 6):
            buffer.write(f'{offsets[idx]:010d} 00000 n \n'.encode('ascii'))
        buffer.write(b'trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n')
        buffer.write(str(xref_pos).encode('ascii'))
        buffer.write(b'\n%%EOF')

        return buffer.getvalue()


class ReportItemsView(APIView):
    """
    Lista de items de reporte a partir de KPIs y Proyectos, preservando el formato del frontend.

    Parametros (query):
      - period: 'Ultimos 30 dias' | 'Ultimo trimestre' | 'Ultimo semestre'
      - status: 'Todos' | 'on-track' | 'at-risk' | 'delayed'
      - team: nombre de tipo de KPI (ej: 'Financiero') o 'Todos'
      - owner: nombre de usuario (PM del proyecto) o 'Todos'
      - search: texto libre sobre KPI/proyecto
    """

    PERIOD_DAYS = {
        'Ultimos 30 dias': 30,
        'Ultimo trimestre': 90,
        'Ultimo semestre': 180,
    }

    def get(self, request):
        period = request.query_params.get('period', 'Ultimo trimestre')
        status_filter = request.query_params.get('status', 'Todos')
        team_filter = request.query_params.get('team', 'Todos')
        owner_filter = request.query_params.get('owner', 'Todos')
        search = (request.query_params.get('search') or '').strip().lower()

        days = self.PERIOD_DAYS.get(period, 90)
        now = datetime.utcnow()
        cutoff = now - timedelta(days=days)

        # Traer KPIs con su proyecto y PM
        rows = []
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT k.id_kpi, k.nombre, k.tipo, k.valor_objetivo, k.valor_actual, k.fecha_creacion,
                       p.id_proyecto, p.nombre AS proyecto_nombre, p.fecha_fin, u.nombre AS pm_nombre
                FROM dbo.kpis k
                LEFT JOIN dbo.proyectos p ON p.id_proyecto = k.id_proyecto
                LEFT JOIN dbo.usuarios u ON u.id_usuario = p.id_pm
                """
            )
            for r in cursor.fetchall():
                rows.append({
                    'id_kpi': r[0],
                    'kpi_nombre': r[1],
                    'tipo': r[2],
                    'valor_objetivo': r[3],
                    'valor_actual': r[4],
                    'fecha_creacion': r[5],
                    'id_proyecto': r[6],
                    'proyecto_nombre': r[7],
                    'fecha_fin': r[8],
                    'pm_nombre': r[9],
                })

        def compute_progress(obj):
            objetivo = obj['valor_objetivo'] or 0
            actual = obj['valor_actual'] or 0
            if objetivo and float(objetivo) > 0:
                try:
                    pct = round(float(actual) / float(objetivo) * 100)
                except Exception:
                    pct = 0
            else:
                pct = round(float(actual)) if actual else 0
            return max(0, min(100, pct))

        def compute_status(pct):
            if pct >= 80:
                return 'on-track'
            if pct >= 50:
                return 'at-risk'
            return 'delayed'

        items = []
        teams = set()
        owners = set()

        for row in rows:
            updated_at = row['fecha_creacion']
            if updated_at and isinstance(updated_at, datetime):
                if updated_at < cutoff:
                    continue

            progress = compute_progress(row)
            status_value = compute_status(progress)

            item = {
                'id': f"KPI-{row['id_kpi']}",
                'initiative': row['kpi_nombre'] or f"KPI {row['id_kpi']}",
                'owner': row['pm_nombre'] or 'Sin asignar',
                'team': row['tipo'] or 'General',
                'status': status_value,
                'progress': progress,
                'delta': 0,
                'updatedAt': (row['fecha_creacion'].isoformat() if hasattr(row['fecha_creacion'], 'isoformat') else ''),
                'dueDate': (row['fecha_fin'].isoformat() if hasattr(row['fecha_fin'], 'isoformat') else ''),
                'scope': row['proyecto_nombre'] or 'Proyecto',
            }

            # Filtros
            if status_filter != 'Todos' and item['status'] != status_filter:
                continue
            if team_filter != 'Todos' and item['team'] != team_filter:
                continue
            if owner_filter != 'Todos' and item['owner'] != owner_filter:
                continue
            if search:
                hay = f"{item['id']} {item['initiative']} {item['scope']}".lower()
                if search not in hay:
                    continue

            items.append(item)
            teams.add(item['team'])
            owners.add(item['owner'])

        # Milestones sencillos desde tareas más próximas por proyecto (opcional, si existen)
        milestones = []
        try:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT TOP 6 t.titulo, ISNULL(t.descripcion,''), u.nombre as owner,
                           t.fecha_vencimiento, t.estado, t.progreso
                    FROM dbo.tareas t
                    LEFT JOIN dbo.usuarios u ON u.id_usuario = t.id_usuario_asignado
                    WHERE t.fecha_vencimiento IS NOT NULL
                    ORDER BY t.fecha_vencimiento ASC
                    """
                )
                for r in cursor.fetchall():
                    status_map = {
                        'Completada': 'done',
                        'En progreso': 'in-progress',
                        'Pendiente': 'pending'
                    }
                    milestones.append({
                        'title': r[0],
                        'description': r[1],
                        'owner': r[2] or 'Equipo',
                        'target': (r[3].isoformat() if hasattr(r[3], 'isoformat') else ''),
                        'status': status_map.get(r[4], 'in-progress'),
                        'completion': int(round(float(r[5] or 0)))
                    })
        except Exception:
            milestones = []

        payload = {
            'items': items,
            'teams': sorted(list(teams)),
            'owners': sorted(list(owners)),
            'milestones': milestones,
        }
        return Response(payload)


class ReportListCreateView(APIView):
    """
    Crear un reporte (snapshot) y listar reportes creados.

    POST: Crea un reporte persistiendo el payload.
    GET: Lista reportes (filtros: id_usuario, q, desde, hasta)
    """

    def get(self, request):
        qs = ReporteSnapshot.objects.all().order_by('-fecha_creacion')
        raw_user = request.query_params.get('id_usuario')
        if raw_user not in (None, ''):
            try:
                qs = qs.filter(id_usuario=int(raw_user))
            except ValueError:
                pass
        q = (request.query_params.get('q') or '').strip().lower()
        if q:
            qs = qs.filter(titulo__icontains=q)

        desde = request.query_params.get('desde')
        hasta = request.query_params.get('hasta')
        if desde:
            try:
                qs = qs.filter(fecha_creacion__date__gte=desde)
            except Exception:
                pass
        if hasta:
            try:
                qs = qs.filter(fecha_creacion__date__lte=hasta)
            except Exception:
                pass

        return Response(ReporteSerializer(qs, many=True).data)

    def post(self, request):
        serializer = ReporteCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        reporte = ReporteSnapshot.objects.create(
            titulo=data['titulo'],
            id_usuario=data['id_usuario'],
            filtros=data.get('filtros') or {},
            resumen=data.get('resumen') or {},
            items=data.get('items') or [],
            secciones=data.get('secciones') or [],
            nota=data.get('nota') or '',
            formato=data.get('formato') or {},
            nombre_archivo=data.get('nombre_archivo') or '',
        )

        # Notificación opcional al autor
        try:
            create_notification_if_enabled(
                id_usuario=reporte.id_usuario,
                tipo='reporte_creado',
                titulo=f"Reporte creado: {reporte.titulo}",
                mensaje='Tu reporte está disponible para descarga.',
                link=f"/dashboard/reportes"
            )
        except Exception:
            pass

        return Response(ReporteSerializer(reporte).data, status=status.HTTP_201_CREATED)


class ReportRetrieveDeleteView(APIView):
    def get(self, request, id_reporte: int):
        reporte = ReporteSnapshot.objects.filter(id_reporte=id_reporte).first()
        if not reporte:
            return Response({'detail': 'No encontrado'}, status=status.HTTP_404_NOT_FOUND)
        return Response(ReporteSerializer(reporte).data)

    def delete(self, request, id_reporte: int):
        ReporteSnapshot.objects.filter(id_reporte=id_reporte).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ReportPDFDetailView(APIView):
    """Descarga PDF desde un reporte almacenado."""
    def get(self, request, id_reporte: int):
        reporte = ReporteSnapshot.objects.filter(id_reporte=id_reporte).first()
        if not reporte:
            return Response({'detail': 'No encontrado'}, status=status.HTTP_404_NOT_FOUND)

        title = reporte.titulo
        generated_at = datetime.now().strftime('%Y-%m-%d %H:%M')
        lines = [title, f'Generado: {generated_at}', '']

        formato = reporte.formato or {}
        mostrar_filtros = formato.get('mostrarFiltros', True)
        mostrar_resumen = formato.get('mostrarResumen', True)
        mostrar_items = formato.get('mostrarItems', True)
        mostrar_secciones = formato.get('mostrarSecciones', True)
        tamano_fuente = formato.get('tamanoFuente', 14)
        pie_pagina = formato.get('piePagina', '')

        if mostrar_filtros and reporte.filtros:
            lines.append('Filtros aplicados:')
            for k, v in (reporte.filtros or {}).items():
                lines.append(f'  - {k}: {v}')
            lines.append('')

        if mostrar_resumen and reporte.resumen:
            lines.append('Resumen ejecutivo:')
            for k, v in (reporte.resumen or {}).items():
                lines.append(f'  - {k}: {v}')
            lines.append('')

        if mostrar_items and reporte.items:
            lines.append('Principales iniciativas:')
            for item in (reporte.items or [])[:5]:
                name = item.get('initiative') or item.get('iniciativa') or 'Elemento'
                status_value = item.get('status') or item.get('estado') or ''
                progress = item.get('progress') or item.get('progreso') or ''
                owner = item.get('owner') or item.get('responsable') or ''
                lines.append(f'  • {name} ({status_value}) - {progress} {(" / " + owner) if owner else ""}'.rstrip())
            lines.append('')

        if mostrar_secciones and reporte.secciones:
            lines.append('Secciones incluidas:')
            for section in reporte.secciones or []:
                nombre = section.get('label') or section.get('titulo') or section.get('key') or ''
                descripcion = section.get('description') or section.get('descripcion') or ''
                lines.append(f'  - {nombre}')
                if descripcion:
                    for wrapped in ReportExportPDFView()._wrap_text(descripcion, width=90, indent='      '):
                        lines.append(wrapped)
            lines.append('')

        if reporte.nota:
            lines.append('Notas:')
            for wrapped in ReportExportPDFView()._wrap_text(reporte.nota, width=95, indent='  '):
                lines.append(wrapped)

        pdf_bytes = ReportExportPDFView()._build_simple_pdf(lines, tamano_fuente, pie_pagina)
        filename = reporte.nombre_archivo or slugify(title) or 'reporte'
        response = HttpResponse(pdf_bytes, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename={filename}.pdf'
        return response


class ReportExportCSVView(APIView):
    """Exporta a CSV sin guardar (payload actual)."""
    def post(self, request):
        serializer = ReportExportSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        # Armar filas CSV: encabezado + items
        import csv
        import io as _io
        output = _io.StringIO()
        writer = csv.writer(output)

        # Encabezado
        writer.writerow(['KPI', 'Iniciativa', 'Equipo', 'Responsable', 'Estado', 'Avance', 'Delta', 'Actualizado', 'Entrega', 'Scope'])

        for item in (data.get('items') or [])[:1000]:
            writer.writerow([
                item.get('id') or item.get('kpi') or '',
                item.get('initiative') or item.get('iniciativa') or '',
                item.get('team') or '',
                item.get('owner') or item.get('responsable') or '',
                item.get('status') or item.get('estado') or '',
                item.get('progress') or item.get('progreso') or '',
                item.get('delta') or '',
                item.get('updated') or item.get('updatedAt') or '',
                item.get('due') or item.get('dueDate') or '',
                item.get('scope') or '',
            ])

        csv_bytes = output.getvalue().encode('utf-8-sig')
        filename = (data.get('nombre_archivo') or slugify(data.get('titulo') or 'reporte')) + '.csv'
        response = HttpResponse(csv_bytes, content_type='text/csv; charset=utf-8')
        response['Content-Disposition'] = f'attachment; filename={filename}'
        return response


class ReportCSVDetailView(APIView):
    """Descarga CSV desde un reporte almacenado."""
    def get(self, request, id_reporte: int):
        reporte = ReporteSnapshot.objects.filter(id_reporte=id_reporte).first()
        if not reporte:
            return Response({'detail': 'No encontrado'}, status=status.HTTP_404_NOT_FOUND)

        import csv
        import io as _io
        output = _io.StringIO()
        writer = csv.writer(output)
        writer.writerow(['KPI', 'Iniciativa', 'Equipo', 'Responsable', 'Estado', 'Avance', 'Delta', 'Actualizado', 'Entrega', 'Scope'])

        for item in (reporte.items or [])[:1000]:
            writer.writerow([
                item.get('id') or item.get('kpi') or '',
                item.get('initiative') or item.get('iniciativa') or '',
                item.get('team') or '',
                item.get('owner') or item.get('responsable') or '',
                item.get('status') or item.get('estado') or '',
                item.get('progress') or item.get('progreso') or '',
                item.get('delta') or '',
                item.get('updated') or item.get('updatedAt') or '',
                item.get('due') or item.get('dueDate') or '',
                item.get('scope') or '',
            ])

        csv_bytes = output.getvalue().encode('utf-8-sig')
        filename = (reporte.nombre_archivo or slugify(reporte.titulo) or 'reporte') + '.csv'
        response = HttpResponse(csv_bytes, content_type='text/csv; charset=utf-8')
        response['Content-Disposition'] = f'attachment; filename={filename}'
        return response
