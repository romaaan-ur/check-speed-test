# Internet Speed Test

Простой CLI-инструмент для измерения скорости скачивания с использованием Node.js.

## Requirements

- Node.js >= 18

## Использование

```bash
node index.js <URL>
```

Пример:

```bash
node index.js https://picsum.photos/5000/5000
```

Также можно использовать:

```bash
npm start -- https://picsum.photos/5000/5000
```

## Выходные значения

- Downloaded data: MB (1 MB = 1,000,000 bytes).
- Average request time: milliseconds (ms).
- Total time: sec
- Download speed: Mbps (megabits per second).

Скорость загрузки считается по формуле:

```text
Скорость (Mbps) = Кол-во байтов * 8 / Всего времени (сек) / 1,000,000
```