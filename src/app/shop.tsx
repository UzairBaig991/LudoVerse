import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const shopItems = [
  { name: 'Golden Dice', price: '1200', accent: '#FFD700' },
  { name: 'Royal Blue', price: '900', accent: '#2196F3' },
  { name: 'Forest Green', price: '850', accent: '#4CAF50' },
  { name: 'Crimson Red', price: '800', accent: '#F44336' },
];

export default function ShopScreen() {
  return (
    <LinearGradient colors={['#10152A', '#151B35', '#1A254A']} style={styles.background}>
      <View style={styles.container}>
        <Text style={styles.title}>Ludo Shop</Text>
        {shopItems.map((item) => (
          <View key={item.name} style={styles.itemCard}>
            <View style={[styles.swatch, { backgroundColor: item.accent }]} />
            <View style={styles.textWrap}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.price}>{item.price} coins</Text>
            </View>
            <TouchableOpacity style={styles.buyButton}>
              <Text style={styles.buyText}>Buy</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 52 },
  title: { color: '#FFFFFF', fontSize: 34, fontWeight: '800', marginBottom: 20 },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(17,24,39,0.75)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 16,
    marginBottom: 12,
  },
  swatch: { width: 34, height: 34, borderRadius: 10, marginRight: 14 },
  textWrap: { flex: 1 },
  itemName: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
  price: { color: '#AFC5FF', marginTop: 4 },
  buyButton: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  buyText: { color: '#10152A', fontWeight: '800' },
});
