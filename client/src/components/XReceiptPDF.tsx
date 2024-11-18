import React from 'react';
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import { format } from 'date-fns';

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#fff',
    padding: 30,
  },
  section: {
    margin: 10,
    padding: 10,
  },
  header: {
    fontSize: 20,
    marginBottom: 20,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  label: {
    fontSize: 12,
    color: '#666',
  },
  value: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  separator: {
    borderBottom: 1,
    borderBottomColor: '#ddd',
    borderBottomStyle: 'dashed',
    marginVertical: 15,
  },
  footer: {
    marginTop: 30,
    textAlign: 'center',
    fontSize: 10,
    color: '#666',
  },
});

export function XReceiptPDF({ user }: { user: any }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          <Text style={styles.header}>X Receipt</Text>
          
          <View style={styles.row}>
            <Text style={styles.label}>CUSTOMER:</Text>
            <Text style={styles.value}>{user.name}</Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>@USERNAME:</Text>
            <Text style={styles.value}>{user.username}</Text>
          </View>
          
          <View style={styles.separator} />
          
          <View style={styles.row}>
            <Text style={styles.label}>POSTS:</Text>
            <Text style={styles.value}>{user.public_metrics.tweet_count.toLocaleString()}</Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>FOLLOWERS:</Text>
            <Text style={styles.value}>{user.public_metrics.followers_count.toLocaleString()}</Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>FOLLOWING:</Text>
            <Text style={styles.value}>{user.public_metrics.following_count.toLocaleString()}</Text>
          </View>
          
          <View style={styles.separator} />
          
          <View style={styles.row}>
            <Text style={styles.label}>MEMBER SINCE:</Text>
            <Text style={styles.value}>{format(new Date(user.created_at), 'MMM dd, yyyy')}</Text>
          </View>
          
          <Text style={styles.footer}>
            Generated on {format(new Date(), 'MMMM dd, yyyy')}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
