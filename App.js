import { useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

const GAME_DURATION = 60;
const GRID_SIZE = 4;

function getRandomCell() {
  const maxIndex = GRID_SIZE * GRID_SIZE - 1;
  const index = Math.floor(Math.random() * (maxIndex + 1));
  return {
    row: Math.floor(index / GRID_SIZE),
    column: index % GRID_SIZE,
  };
}

export default function App() {
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [score, setScore] = useState(0);
  const [activeCell, setActiveCell] = useState(getRandomCell());
  const [multiplier, setMultiplier] = useState(1);
  const timerRef = useRef(null);

  const cells = useMemo(() => {
    const items = [];
    for (let row = 0; row < GRID_SIZE; row += 1) {
      for (let column = 0; column < GRID_SIZE; column += 1) {
        const id = `${row}-${column}`;
        items.push({ id, row, column });
      }
    }
    return items;
  }, []);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft((current) => {
        if (current <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, []);

  useEffect(() => {
    if (timeLeft === 0) {
      setActiveCell(null);
    }
  }, [timeLeft]);

  const handleCellPress = (row, column) => {
    if (timeLeft === 0 || !activeCell) return;
    if (row === activeCell.row && column === activeCell.column) {
      setScore((value) => value + 10 * multiplier);
      setMultiplier((value) => Math.min(5, value + 0.2));
      setActiveCell(getRandomCell());
    } else {
      setMultiplier(1);
    }
  };

  const handleRestart = () => {
    setScore(0);
    setMultiplier(1);
    setTimeLeft(GAME_DURATION);
    setActiveCell(getRandomCell());
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((current) => {
        if (current <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return current - 1;
      });
    }, 1000);
  };

  const cellSize = Math.min(Dimensions.get('window').width, 420) / GRID_SIZE - 8;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <View style={styles.headerBlock}>
          <Text style={styles.label}>Temps</Text>
          <Text style={styles.value}>{timeLeft}s</Text>
        </View>
        <View style={styles.headerBlock}>
          <Text style={styles.label}>Score</Text>
          <Text style={styles.value}>{score}</Text>
        </View>
        <View style={styles.headerBlock}>
          <Text style={styles.label}>Combo</Text>
          <Text style={styles.value}>x{multiplier.toFixed(1)}</Text>
        </View>
      </View>

      <Text style={styles.subtitle}>
        Touchez la case en surbrillance pour marquer des points avant la fin du compte à rebours.
      </Text>

      <View style={styles.grid}>
        {cells.map((cell) => {
          const isActive = activeCell && cell.row === activeCell.row && cell.column === activeCell.column;
          return (
            <Pressable
              key={cell.id}
              onPress={() => handleCellPress(cell.row, cell.column)}
              style={[styles.cell, { width: cellSize, height: cellSize }, isActive ? styles.activeCell : null]}
            >
              {isActive ? <Text style={styles.cellLabel}>+10</Text> : null}
            </Pressable>
          );
        })}
      </View>

      <View style={styles.actions}>
        <Pressable style={[styles.button, styles.restart]} onPress={handleRestart}>
          <Text style={styles.buttonText}>Rejouer</Text>
        </Pressable>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Ouvrez l'application dans Expo Go ou sur le web pour tester rapidement votre mini-jeu.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerBlock: {
    backgroundColor: '#0f172a',
    padding: 12,
    borderRadius: 12,
    width: '31%',
  },
  label: {
    color: '#cbd5e1',
    fontSize: 12,
    marginBottom: 4,
  },
  value: {
    color: '#f8fafc',
    fontSize: 20,
    fontWeight: 'bold',
  },
  subtitle: {
    marginTop: 18,
    fontSize: 14,
    color: '#0f172a',
    lineHeight: 20,
  },
  grid: {
    marginTop: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cell: {
    borderRadius: 10,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0f172a',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 4,
  },
  activeCell: {
    backgroundColor: '#22c55e',
  },
  cellLabel: {
    color: '#0f172a',
    fontWeight: 'bold',
  },
  actions: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  button: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
  },
  restart: {
    backgroundColor: '#2563eb',
  },
  buttonText: {
    color: '#f8fafc',
    fontWeight: 'bold',
    fontSize: 16,
  },
  footer: {
    marginTop: 24,
    paddingHorizontal: 8,
  },
  footerText: {
    color: '#475569',
    textAlign: 'center',
  },
});
