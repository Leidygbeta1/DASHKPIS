import io
from datetime import datetime

from rest_framework import generics, status, serializers
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db import connection
from django.http import HttpResponse
from django.utils.text import slugify
from .models import Proyecto, PanelLayoutPreference
from .serializers import ProyectoSerializer, PanelLayoutPreferenceSerializer, ReportExportSerializer
from apps.notifications.utils import create_notification_if_enabled
from .layouts import DEFAULT_LAYOUT_CODE, safe_default_panel_state


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
