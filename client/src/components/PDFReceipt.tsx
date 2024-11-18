import { format } from "date-fns";
import { Font, Page, Text, View, Document, StyleSheet, Image, Link } from "@react-pdf/renderer";

Font.register({
  family: "Inter",
  src: "https://rsms.me/inter/font-files/Inter-Regular.woff2",
});

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Inter",
  },
  header: {
    marginBottom: 20,
    textAlign: "center",
  },
  logo: {
    width: 40,
    height: 40,
    marginBottom: 10,
    alignSelf: "center",
  },
  date: {
    fontSize: 12,
    color: "#666",
    marginBottom: 5,
  },
  orderNumber: {
    fontSize: 10,
    color: "#888",
  },
  separator: {
    borderBottom: "1 solid #eee",
    marginVertical: 15,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignSelf: "center",
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  label: {
    fontSize: 12,
    color: "#666",
  },
  value: {
    fontSize: 12,
    fontWeight: "bold",
  },
  footer: {
    marginTop: 30,
    textAlign: "center",
    fontSize: 12,
    color: "#666",
  },
});

export function PDFReceipt({ user }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.date}>{format(new Date(), "EEEE, MMMM dd, yyyy")}</Text>
          <Text style={styles.orderNumber}>
            ORDER #{`${user.username.toUpperCase()}-${Date.now().toString(36)}`}
          </Text>
        </View>

        {user.profile_image_url && (
          <Image src={user.profile_image_url} style={styles.profileImage} />
        )}

        <View style={styles.infoRow}>
          <Text style={styles.label}>CUSTOMER:</Text>
          <Text style={styles.value}>{user.name}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>@USERNAME:</Text>
          <Text style={styles.value}>{user.username}</Text>
        </View>

        <View style={styles.separator} />

        <View style={styles.infoRow}>
          <Text style={styles.label}>POSTS:</Text>
          <Text style={styles.value}>
            {user.public_metrics.tweet_count.toLocaleString()}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>FOLLOWERS:</Text>
          <Text style={styles.value}>
            {user.public_metrics.followers_count.toLocaleString()}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>FOLLOWING:</Text>
          <Text style={styles.value}>
            {user.public_metrics.following_count.toLocaleString()}
          </Text>
        </View>

        <View style={styles.separator} />

        <View style={styles.infoRow}>
          <Text style={styles.label}>VERIFIED:</Text>
          <Text style={styles.value}>{user.verified ? "Yes" : "No"}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>MEMBER SINCE:</Text>
          <Text style={styles.value}>
            {format(new Date(user.created_at), "MMM dd, yyyy")}
          </Text>
        </View>

        <View style={styles.footer}>
          <Text>THANK YOU FOR POSTING!</Text>
          <Link src={`https://x.com/${user.username}`}>
            <Text>x.com/{user.username}</Text>
          </Link>
        </View>
      </Page>
    </Document>
  );
}
