# Предварительные motion tokens

P0, значения для визуальной проверки. Реализация в P2. Вариант «Сбалансированный».

| Токен | Значение | Применение |
|---|---|---|
| feedback | 120 ms | hover и короткая реакция контролов |
| press | 90 ms | возврат из pressed, начало по нажатию |
| micro | 180 ms | popover, badges и короткий fade |
| content | 240 ms | смена области и результат загрузки |
| overlay | 260 ms | Palette и Dialog |
| drawer | 300 ms | панель деталей |
| complex | 360 ms | переход к графу или широкий shared layout |
| reduced | 0–80 ms | fade или мгновенное обновление |
| ease-out | cubic-bezier(.2,.8,.2,1) | вход и переход |
| ease-in | cubic-bezier(.4,0,1,1) | выход, короче входа |
| travel | 4 / 6 / 8 px | контроль / контент / слой |
| small-stagger | 18 ms, до 6 элементов | маленькая группа |
| selection-spring | stiffness 420, damping 38, mass .8 | sidebar и вкладки |
| panel-spring | stiffness 340, damping 36, mass .9 | связанная геометрия панели, проверить без отскока |

Анимация не задерживает ввод. CSS и Motion используют согласованные значения и системный reduced motion. Изменения токенов фиксировать по записям Playground.
