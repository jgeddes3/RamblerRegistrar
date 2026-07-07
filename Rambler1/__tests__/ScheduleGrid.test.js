// ScheduleGrid.test.js — presentational grid tests.
// RNTL v14: render() is ASYNC — always `await render(...)`.
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import ScheduleGrid, { HOUR_HEIGHT } from '../components/ScheduleGrid';

const comp170 = {
  subject: 'COMP',
  catalog_number: '170',
  class_number: '4410',
  building: 'Cuneo Hall',
};
const hist342 = {
  subject: 'HIST',
  catalog_number: '342C',
  class_number: '5588',
  building: 'Crown Center',
};
const hist378 = {
  subject: 'HIST',
  catalog_number: '378',
  class_number: '5695',
  building: 'Life Science Building-Room 412',
};

// Three blocks on Tuesday; the two HIST ones overlap (11:30-12:45 vs 12:00-1:15).
const blocks = [
  {
    key: '4410:0:Tu:480-555', // 8:00AM - 9:15AM -> top should be 0 at startHour 8
    day: 'Tu',
    startMin: 480,
    endMin: 555,
    section: comp170,
    color: '#2563eb',
    label: 'COMP 170',
  },
  {
    key: '5588:0:Tu:690-765',
    day: 'Tu',
    startMin: 690,
    endMin: 765,
    section: hist342,
    color: '#059669',
    label: 'HIST 342C',
  },
  {
    key: '5695:0:Tu:720-795',
    day: 'Tu',
    startMin: 720,
    endMin: 795,
    section: hist378,
    color: '#d97706',
    label: 'HIST 378',
  },
];

const conflicts = [{ a: blocks[1], b: blocks[2] }];
const days = ['Mo', 'Tu', 'We', 'Th', 'Fr'];

describe('ScheduleGrid', () => {
  test('renders block labels, day headers and hour labels', async () => {
    await render(
      <ScheduleGrid
        blocks={blocks}
        conflicts={conflicts}
        startHour={8}
        endHour={17}
        days={days}
        onPressBlock={() => {}}
      />
    );
    expect(screen.getByText('COMP 170')).toBeTruthy();
    expect(screen.getByText('HIST 342C')).toBeTruthy();
    expect(screen.getByText('HIST 378')).toBeTruthy();
    expect(screen.getByText('Tue')).toBeTruthy();
    expect(screen.getByText('Mon')).toBeTruthy();
    expect(screen.getByText('8 AM')).toBeTruthy();
    expect(screen.getByText('12 PM')).toBeTruthy();
    // Building shown inside blocks
    expect(screen.getByText('Cuneo Hall')).toBeTruthy();
  });

  test('conflicted blocks get the red border; non-conflicted do not', async () => {
    await render(
      <ScheduleGrid
        blocks={blocks}
        conflicts={conflicts}
        startHour={8}
        endHour={17}
        days={days}
      />
    );
    const a = screen.getByTestId('block-5588:0:Tu:690-765');
    const b = screen.getByTestId('block-5695:0:Tu:720-795');
    expect(a).toHaveStyle({ borderColor: '#d00000', borderWidth: 2 });
    expect(b).toHaveStyle({ borderColor: '#d00000', borderWidth: 2 });
    const clean = screen.getByTestId('block-4410:0:Tu:480-555');
    expect(clean).not.toHaveStyle({ borderColor: '#d00000' });
  });

  test('onPressBlock fires with the pressed block', async () => {
    const onPressBlock = jest.fn();
    await render(
      <ScheduleGrid
        blocks={blocks}
        conflicts={[]}
        startHour={8}
        endHour={17}
        days={days}
        onPressBlock={onPressBlock}
      />
    );
    await fireEvent.press(screen.getByTestId('block-4410:0:Tu:480-555'));
    expect(onPressBlock).toHaveBeenCalledTimes(1);
    expect(onPressBlock).toHaveBeenCalledWith(blocks[0]);
  });

  test('an 8AM block has computed top 0 when startHour=8, and proportional height', async () => {
    await render(
      <ScheduleGrid
        blocks={blocks}
        conflicts={[]}
        startHour={8}
        endHour={17}
        days={days}
      />
    );
    const eightAm = screen.getByTestId('block-4410:0:Tu:480-555');
    expect(eightAm).toHaveStyle({ top: 0 });
    // 75-minute block: (75/60)*HOUR_HEIGHT
    expect(eightAm).toHaveStyle({ height: (75 / 60) * HOUR_HEIGHT });
    // 11:30AM block: (690-480)/60 * HOUR_HEIGHT above the 8AM line
    const noonish = screen.getByTestId('block-5588:0:Tu:690-765');
    expect(noonish).toHaveStyle({ top: (210 / 60) * HOUR_HEIGHT });
  });

  test('renders without crashing with no blocks and default conflicts', async () => {
    await render(
      <ScheduleGrid blocks={[]} startHour={8} endHour={17} days={days} />
    );
    expect(screen.getByText('Fri')).toBeTruthy();
  });
});

test('fully overlapping blocks render side-by-side in half-width lanes', async () => {
  const mk = (key, label) => ({
    key, day: 'Tu', startMin: 16 * 60 + 15, endMin: 17 * 60 + 30,
    section: { class_number: key, building: 'Cuneo Hall' },
    color: '#A30046', label,
  });
  const a = mk('A', 'COMP 170');
  const b = mk('B', 'BIOL 101');
  const { getByTestId } = await render(
    <ScheduleGrid blocks={[a, b]} startHour={8} endHour={18} days={['Tu']} />
  );
  // Both blocks visible, each in its own 50% lane — neither buried.
  expect(getByTestId('block-A')).toHaveStyle({ width: '50%', left: '0%' });
  expect(getByTestId('block-B')).toHaveStyle({ width: '50%', left: '50%' });
});
