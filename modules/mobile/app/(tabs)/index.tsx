import { View, Text, StyleSheet } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Votestar Safe Mode</Text>
      <Text style={styles.text}>If you can see this, the core app config is working.</Text>
      <Text style={styles.text}>The crash was likely caused by a component or asset in the original screen.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#000',
  },
  text: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
  },
});
