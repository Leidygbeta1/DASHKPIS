import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '1m', target: 30 },  // ramp-up
    { duration: '3m', target: 30 },  // steady
    { duration: '30s', target: 60 }, // spike
    { duration: '2m', target: 60 },  // sustain spike
    { duration: '1m', target: 0 },   // ramp-down
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<450', 'p(99)<900'],
  },
};

const BASE = __ENV.BASE_URL;

export default function () {
  // Dashboard layout
  const layout = http.get(`${BASE}/api/dashboard/layout`);
  check(layout, { 'layout 200': r => r.status === 200 });

  // KPIs
  const kpis = http.get(`${BASE}/api/kpis?page=1&page_size=50`);
  check(kpis, { 'kpis 200': r => r.status === 200 });

  // Proyectos
  const proyectos = http.get(`${BASE}/api/proyectos`);
  check(proyectos, { 'proyectos 200': r => r.status === 200 });

  // Tareas de un proyecto (id=1 ejemplo)
  const tareas = http.get(`${BASE}/api/proyectos/1/tareas`);
  check(tareas, { 'tareas 200': r => r.status === 200 });

  // Pausa breve (think time)
  sleep(Math.random() * 1);
}